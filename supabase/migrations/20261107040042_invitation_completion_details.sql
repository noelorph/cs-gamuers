alter table private.account_operations add column requested_employee_number text
  check (requested_employee_number is null or char_length(requested_employee_number) between 1 and 50);

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
    update public.accounts set full_name=o.requested_full_name,employee_number=o.requested_employee_number,application_status='approved',revoked_before=clock_timestamp() where id=a.id;
    update private.account_operations set state='complete',requested_full_name=null where id=o.id returning * into o;
    update private.email_proofs set state='complete',native_verifier=null,delivery_challenge=null where id=p.id returning * into p;
    insert into private.account_events(actor_id,account_id,event,reason) values(r.invited_by,a.id,'invitation_accepted','Synthetic fixture invitation accepted by its verified holder') returning id into event_id;
    insert into private.mail_work(event_id,recipient,kind) values(event_id,a.email,'approved');
  elsif step<>'inspect' and p.state<>'complete' then raise exception 'Invalid operation step';
  end if;
  return jsonb_build_object('proof_id',p.id,'account_id',p.account_id,'purpose',p.purpose,'state',p.state,'operation_id',p.operation_id,'operation_state',o.state,'expires_at',p.expires_at,'recipient',a.email,'role',a.role);
end;
$$;

create function private.stage_invitation_details(proof_id uuid, capability_hash text, employee_number text) returns void
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare p private.email_proofs; o private.account_operations;
begin
  -- Reuse the account/reservation/proof/operation locks and expiry checks.
  perform private.advance_email_operation(proof_id, capability_hash, 'inspect');
  select * into p from private.email_proofs where id=proof_id;
  select * into o from private.account_operations where id=p.operation_id;
  if p.purpose<>'invitation' or p.state<>'verified' or o.state<>'verified'
    or (employee_number is not null and char_length(btrim(employee_number))>50) then
    raise exception 'Invalid invitation details';
  end if;
  update private.account_operations set requested_employee_number=nullif(btrim(employee_number),'') where id=o.id;
end;
$$;
create function public.stage_invitation_details(proof_id uuid, capability_hash text, employee_number text default null) returns void
language sql security invoker set search_path = '' as $$
  select private.stage_invitation_details(proof_id, capability_hash, employee_number);
$$;
revoke all on function private.stage_invitation_details(uuid,text,text), public.stage_invitation_details(uuid,text,text) from public,anon,authenticated;
grant execute on function private.stage_invitation_details(uuid,text,text), public.stage_invitation_details(uuid,text,text) to service_role;
