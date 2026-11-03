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
    or r.released_at is not null or p.generation<>r.proof_generation or a.role<>r.role or (p.state<>'complete' and a.application_status<>'pending')
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
create or replace function private.reconcile_auth_mail() returns void
language plpgsql security definer set search_path = '' as $$
declare candidate record; p private.email_proofs; a public.accounts; o private.account_operations; r private.account_reservations;
begin
  for candidate in select id,account_id,reservation_id from private.email_proofs where state not in ('complete','failed') order by account_id limit 100 loop
    select * into a from public.accounts where id=candidate.account_id for update;
    select * into r from private.account_reservations where id=candidate.reservation_id for update;
    select * into p from private.email_proofs where id=candidate.id for update;
    if p.state in ('complete','failed') then continue; end if;
    select * into o from private.account_operations where id=p.operation_id for update;
    if r.released_at is not null or p.generation<>r.proof_generation or not a.active or a.application_status<>'pending'
      or a.role<>r.role or a.email<>r.email or (o.id is not null and o.generation<>a.operation_generation) then
      update private.account_operations set state='failed',requested_full_name=null where id=o.id and state<>'complete';
      update private.email_proofs set state='failed',native_verifier=null,delivery_challenge=null,capability_hash=null where id=p.id;
    elsif o.state='auth_applied' and p.state='verified' and o.requested_full_name is not null then
      perform private.advance_email_operation(p.id,p.capability_hash,'finish');
    elsif o.state='auth_applied' and p.state='claimed' and p.expires_at>clock_timestamp() then
      perform private.advance_email_operation(p.id,p.capability_hash,'redeemed');
    elsif p.expires_at<=clock_timestamp() or (o.state='applying' and o.started_at<=clock_timestamp()-interval '2 minutes') then
      update private.account_operations set state=case when state='auth_applied' then 'complete' else 'failed' end,requested_full_name=null
        where id=o.id and state in ('pending','verified','applying','auth_applied');
      update private.email_proofs set state='failed',native_verifier=null,delivery_challenge=null,capability_hash=null where id=p.id;
    end if;
  end loop;
  update private.email_proofs set native_verifier=null,delivery_challenge=null,capability_hash=null where expires_at<=clock_timestamp();
  update private.mail_work set state='discarded',lease_id=null,lease_until=null where state in ('pending','sending') and proof_id in
    (select id from private.email_proofs where state<>'pending' or expires_at<=clock_timestamp());
end;
$$;
