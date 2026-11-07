drop function public.stage_invitation_details(uuid,text,text);
drop function private.stage_invitation_details(uuid,text,text);
create function private.apply_invitation_details(proof_id uuid, capability_hash text, employee_number text, full_name text) returns jsonb
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
  return private.advance_email_operation(proof_id, capability_hash, 'apply', full_name);
end;
$$;

create function public.apply_invitation_details(proof_id uuid, capability_hash text, employee_number text, full_name text) returns jsonb
language sql security invoker set search_path = '' as $$
  select private.apply_invitation_details(proof_id, capability_hash, employee_number, full_name);
$$;
revoke all on function private.apply_invitation_details(uuid,text,text,text), public.apply_invitation_details(uuid,text,text,text) from public,anon,authenticated;
grant execute on function private.apply_invitation_details(uuid,text,text,text), public.apply_invitation_details(uuid,text,text,text) to service_role;
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
      update private.account_operations set state='failed',requested_full_name=null,requested_employee_number=null where id=o.id and state<>'complete';
      update private.email_proofs set state='failed',native_verifier=null,delivery_challenge=null,capability_hash=null where id=p.id;
    elsif o.state='auth_applied' and p.state='verified' and o.requested_full_name is not null then
      perform private.advance_email_operation(p.id,p.capability_hash,'finish');
    elsif o.state='auth_applied' and p.state='claimed' and p.expires_at>clock_timestamp() then
      perform private.advance_email_operation(p.id,p.capability_hash,'redeemed');
    elsif p.expires_at<=clock_timestamp() or (o.state='applying' and o.started_at<=clock_timestamp()-interval '2 minutes') then
      update private.account_operations set state=case when state='auth_applied' then 'complete' else 'failed' end,requested_full_name=null,requested_employee_number=null
        where id=o.id and state in ('pending','verified','applying','auth_applied');
      update private.email_proofs set state='failed',native_verifier=null,delivery_challenge=null,capability_hash=null where id=p.id;
    end if;
  end loop;
  update private.email_proofs set native_verifier=null,delivery_challenge=null,capability_hash=null where expires_at<=clock_timestamp();
  update private.mail_work set state='discarded',lease_id=null,lease_until=null where state in ('pending','sending') and proof_id in
    (select id from private.email_proofs where state<>'pending' or expires_at<=clock_timestamp());
end;
$$;
