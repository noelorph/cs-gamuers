alter table private.email_proofs add column native_type text;
update private.email_proofs set native_type=case purpose when 'verification' then 'signup' else 'invite' end;
alter table private.email_proofs alter column native_type set not null;
alter table private.email_proofs add constraint email_proofs_native_type_check check(native_type in ('signup','invite','recovery'));

create or replace function private.issue_auth_email(target_id uuid, recipient text, native_type text, native_verifier text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a public.accounts; r private.account_reservations; issued timestamptz := clock_timestamp(); challenge text; new_proof_id uuid; proof_purpose text;
begin
  if native_type not in ('signup','invite','recovery') or native_type is null or native_verifier is null or length(native_verifier) not between 16 and 256 then
    raise exception 'Unsupported email proof' using errcode='23514';
  end if;
  proof_purpose := case native_type when 'signup' then 'verification' else 'invitation' end;
  select * into a from public.accounts where id=target_id for update;
  select * into r from private.account_reservations where email=lower(btrim(recipient)) and released_at is null for update;
  if r.id is null or r.email is distinct from recipient or (a.id is not null and (a.email<>recipient or r.account_id is distinct from a.id))
      or (a.id is null and (r.account_id is not null or r.consumed_at is not null or r.expires_at<=issued))
      or (native_type='invite' and r.purpose<>'invitation') or (native_type='signup' and r.purpose<>'registration')
      or (native_type='recovery' and (r.purpose<>'invitation' or a.id is null or a.role<>r.role))
      or (a.id is not null and (not a.active or a.application_status<>'pending')) then
    raise exception 'Reserved recipient required' using errcode='23514';
  end if;
  if exists(select 1 from private.account_operations where account_id=target_id and state in ('applying','auth_applied')) then
    raise exception 'Operation in progress' using errcode='55000';
  end if;
  if exists(select 1 from private.email_proofs p where p.reservation_id=r.id and p.purpose=proof_purpose and p.created_at>issued-interval '60 seconds')
      or (select count(*) from private.email_proofs p where p.reservation_id=r.id and p.purpose=proof_purpose and p.created_at>issued-interval '1 hour')>=5 then
    raise exception 'Retry later' using errcode='55000';
  end if;
  update private.email_proofs set state='failed',native_verifier=null,delivery_challenge=null,capability_hash=null
    where reservation_id=r.id and state not in ('complete','failed');
  update private.mail_work set state='discarded',lease_id=null,lease_until=null
    where proof_id in(select id from private.email_proofs where reservation_id=r.id) and state in ('pending','sending');
  update private.account_operations set state='failed' where account_id=target_id and state in ('pending','verified');
  update private.account_reservations set proof_generation=proof_generation+1 where id=r.id returning * into r;
  challenge := encode(extensions.gen_random_bytes(32),'hex');
  insert into private.email_proofs(reservation_id,account_id,generation,purpose,native_type,challenge_hash,native_verifier,delivery_challenge,created_at,expires_at)
    values(r.id,target_id,r.proof_generation,proof_purpose,native_type,encode(extensions.digest(challenge,'sha256'),'hex'),native_verifier,challenge,issued,issued+interval '1800 seconds') returning id into new_proof_id;
  insert into private.mail_work(proof_id,recipient,kind) values(new_proof_id,r.email,proof_purpose);
  return '{"queued":true}'::jsonb;
end;
$$;

create or replace function private.claim_email_challenge(challenge_hash text, capability_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare p private.email_proofs; a public.accounts; r private.account_reservations; op uuid; gen bigint;
begin
  if challenge_hash !~ '^[a-f0-9]{64}$' or capability_hash !~ '^[a-f0-9]{64}$' or capability_hash is null then raise exception 'Invalid proof'; end if;
  select * into p from private.email_proofs e where e.challenge_hash=claim_email_challenge.challenge_hash;
  select * into a from public.accounts where id=p.account_id for update;
  select * into r from private.account_reservations where id=p.reservation_id for update;
  select * into p from private.email_proofs where id=p.id for update;
  if p.id is null or a.id is null or not a.active or p.expires_at<=clock_timestamp() or p.generation<>r.proof_generation
      or r.released_at is not null or a.email<>r.email or a.role<>r.role or (p.state<>'complete' and a.application_status<>'pending') or p.state='failed'
      or (p.capability_hash is not null and p.capability_hash<>capability_hash) then raise exception 'Invalid proof'; end if;
  if p.state='pending' then
    if exists(select 1 from private.account_operations where account_id=a.id and state in ('applying','auth_applied')) then raise exception 'Operation in progress'; end if;
    if p.purpose='invitation' and p.native_type='invite' then
      update public.accounts set operation_generation=operation_generation+1 where id=a.id returning operation_generation into gen;
      insert into private.account_operations(account_id,generation,purpose,state,verified_at,expires_at,started_at)
        values(a.id,gen,'invitation_password','applying',clock_timestamp(),p.expires_at,clock_timestamp()) returning id into op;
    end if;
    update private.email_proofs set state='claimed',consumed_at=clock_timestamp(),capability_hash=claim_email_challenge.capability_hash,delivery_challenge=null,operation_id=op where id=p.id returning * into p;
    update private.mail_work set state='discarded',lease_id=null,lease_until=null where proof_id=p.id and state in ('pending','sending');
  end if;
  return jsonb_build_object('proof_id',p.id,'account_id',p.account_id,'purpose',p.purpose,'native_type',p.native_type,'recipient',r.email,'state',p.state,'operation_id',p.operation_id,'native_verifier',p.native_verifier,'expires_at',p.expires_at);
end;
$$;
create or replace function private.advance_email_operation(proof_id uuid,capability_hash text,step text,full_name text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare p private.email_proofs; a public.accounts; r private.account_reservations; o private.account_operations; gen bigint; event_id uuid;
begin
  select * into p from private.email_proofs where id=proof_id;
  select * into a from public.accounts where id=p.account_id for update;
  select * into r from private.account_reservations where id=p.reservation_id for update;
  select * into p from private.email_proofs where id=proof_id for update;
  select * into o from private.account_operations where id=p.operation_id for update;
  if p.id is null or p.capability_hash is distinct from capability_hash or capability_hash is null or (p.expires_at<=clock_timestamp() and not(step='finish' and o.state='auth_applied'))
    or p.generation<>r.proof_generation or a.role<>r.role or (p.state<>'complete' and a.application_status<>'pending')
    or (o.id is not null and o.generation<>a.operation_generation) or p.state in ('pending','failed') or not a.active or a.email<>r.email then raise exception 'Invalid operation'; end if;
  select * into o from private.account_operations where id=p.operation_id for update;
  if step='redeemed' and p.state='claimed' then
    if p.purpose='invitation' then
      if p.native_type='invite' and o.state is distinct from 'auth_applied' then raise exception 'Native proof incomplete'; end if;
      update private.account_operations set state='complete' where id=o.id;
      update public.accounts set operation_generation=operation_generation+1 where id=a.id returning operation_generation into gen;
      insert into private.account_operations(account_id,generation,purpose,state,verified_at,expires_at)
        values(a.id,gen,'invitation_password','verified',clock_timestamp(),p.expires_at) returning * into o;
      update private.email_proofs set operation_id=o.id,state='verified',native_verifier=null where id=p.id returning * into p;
    else
      update private.email_proofs set state='complete',native_verifier=null where id=p.id returning * into p;
    end if;
  elsif step='apply' and p.purpose='invitation' and p.state='verified' then
    if o.state='verified' then
      if full_name is null or char_length(btrim(full_name)) not between 1 and 200 then raise exception 'Invalid name'; end if;
      update private.account_operations set state='applying',started_at=clock_timestamp(),requested_full_name=btrim(full_name) where id=o.id returning * into o;
    elsif o.state not in ('applying','auth_applied','complete') then raise exception 'Invalid operation'; end if;
  elsif step='finish' and p.purpose='invitation' and p.state='verified' then
    if o.state<>'auth_applied' or o.requested_full_name is null then raise exception 'Password not applied'; end if;
    update public.accounts set full_name=o.requested_full_name,application_status='approved',revoked_before=clock_timestamp() where id=a.id;
    update private.account_operations set state='complete',requested_full_name=null where id=o.id returning * into o;
    update private.email_proofs set state='complete',native_verifier=null,delivery_challenge=null where id=p.id returning * into p;
    insert into private.account_events(actor_id,account_id,event,reason) values(r.invited_by,a.id,'invitation_accepted','Synthetic fixture invitation accepted by its verified holder') returning id into event_id;
    insert into private.mail_work(event_id,recipient,kind) values(event_id,a.email,'approved');
  elsif step<>'inspect' and p.state<>'complete' then raise exception 'Invalid operation step';
  end if;
  return jsonb_build_object('proof_id',p.id,'account_id',p.account_id,'purpose',p.purpose,'state',p.state,'operation_id',p.operation_id,'operation_state',o.state,'expires_at',p.expires_at);
end;
$$;
