-- Finalization acknowledges an already committed Auth fence; it grants no new authority.
create or replace function private.advance_replacement_proof(proof_id uuid,capability_hash text,step text) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare a public.accounts; r private.account_reservations; p private.email_proofs; o private.account_operations;
begin
  select * into p from private.email_proofs where id=proof_id;
  select * into a from public.accounts where id=p.account_id for update;
  select * into r from private.account_reservations where id=p.reservation_id for update;
  select * into p from private.email_proofs where id=proof_id for update;
  select * into o from private.account_operations where id=p.operation_id for update;
  if p.id is null or p.purpose<>'replacement' or capability_hash is null or capability_hash !~ '^[a-f0-9]{64}$'
    or (p.capability_hash is not null and p.capability_hash<>capability_hash)
    or (o.state not in ('auth_applied','complete') and (not a.active or a.application_status not in ('pending','needs_correction')))
    or p.state='failed' or r.released_at is not null or p.generation<>r.proof_generation
    or o.id is null or o.generation<>a.operation_generation or o.state='failed'
    or (p.expires_at<=clock_timestamp() and o.state not in ('auth_applied','complete')) then raise exception 'Invalid replacement proof'; end if;
  if step='claim' and p.state='pending' then
    if o.state<>'pending' or a.identity_blocked then raise exception 'Change is resolving'; end if;
    update private.email_proofs set state='claimed',capability_hash=advance_replacement_proof.capability_hash,delivery_challenge=null,consumed_at=clock_timestamp() where id=p.id returning * into p;
    update private.account_operations set state='verified',verified_at=clock_timestamp() where id=o.id returning * into o;
    update private.mail_work set state='discarded',lease_id=null,lease_until=null where proof_id=p.id and state in ('pending','sending');
  elsif step='apply' and p.state='claimed' and o.state='verified' then
    update private.account_operations set state='applying',started_at=clock_timestamp() where id=o.id returning * into o;
    update public.accounts set identity_blocked=true where id=a.id;
  elsif step='finish' and p.state='claimed' then
    if o.state<>'auth_applied' or a.email<>r.email then raise exception 'Identity change is resolving'; end if;
    update private.account_operations set state='complete' where id=o.id returning * into o;
    update private.email_proofs set state='complete',delivery_challenge=null where id=p.id returning * into p;
    update public.accounts set identity_blocked=false where id=a.id;
  elsif step not in ('inspect','claim','finish') or p.state='pending' then raise exception 'Invalid replacement proof'; end if;
  return jsonb_build_object('proof_id',p.id,'account_id',a.id,'purpose',p.purpose,'native_type',p.native_type,'recipient',r.email,'state',p.state,'operation_id',o.id,'operation_state',o.state,'expires_at',p.expires_at);
end $$;
