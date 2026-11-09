alter table private.mail_work drop constraint mail_work_kind_check;
alter table private.mail_work add constraint mail_work_kind_check check(kind in ('verification','invitation','approved','needs_correction','rejected','reopened','replacement','identity_changed'));

create or replace function private.fence_auth_credentials() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  final_user record;
  account public.accounts;
  operation private.account_operations;
  reservation private.account_reservations;
  password_changed boolean := coalesce(new.encrypted_password, '') is distinct from coalesce(old.encrypted_password, '');
  email_changed boolean := new.email is distinct from old.email;
  operation_marker text;
  event_id uuid;
begin
  if not password_changed and not email_changed then return null; end if;
  if password_changed and email_changed then raise exception 'Separate credential operations required' using errcode = '23514'; end if;
  select * into final_user from private.auth_user_for_guard(new.id);
  if not found then return null; end if;
  select * into account from public.accounts where id = new.id for update;
  operation_marker := final_user.raw_app_meta_data ->> case when password_changed then 'password_operation_id' else 'identity_operation_id' end;
  select * into operation from private.account_operations where id::text = operation_marker and account_id = account.id for update;
  if not found or operation.state <> 'applying' or operation.generation <> account.operation_generation
      or operation.verified_at is null or operation.expires_at <= clock_timestamp() then
    raise exception 'Verified credential operation required' using errcode = '23514';
  end if;
  if password_changed then
    if operation.purpose not in ('password_reset','invitation_password','assisted_password')
        or not final_user.has_password then
      raise exception 'Invalid password operation' using errcode = '23514';
    end if;
  else
    select * into reservation from private.account_reservations where id = operation.reservation_id for update;
    if operation.purpose not in ('assisted_email','identity_correction') or not account.identity_blocked
        or reservation.id is null or reservation.purpose <> 'replacement' or reservation.account_id is distinct from account.id
        or reservation.role <> account.role or reservation.student_number is distinct from account.student_number
        or reservation.released_at is not null or reservation.consumed_at is not null
        or reservation.expires_at <= clock_timestamp() or lower(btrim(final_user.email)) <> reservation.email then
      raise exception 'Invalid identity operation' using errcode = '23514';
    end if;
    if operation.purpose='identity_correction' and (not account.active or account.application_status not in ('pending','needs_correction')) then raise exception 'Correction not permitted' using errcode='23514'; end if;
    update public.accounts set email = reservation.email where id = account.id;
    insert into private.account_events(actor_id,account_id,event,reason)
      values(account.id,account.id,'application_email_changed','The email on your CS-GAMUERS application was changed. Contact an Administrator if you did not request this change.') returning id into event_id;
    insert into private.mail_work(event_id,recipient,kind) values(event_id,account.email,'identity_changed');
    update private.account_reservations set consumed_at = clock_timestamp() where id = reservation.id;
    update private.account_reservations set released_at = clock_timestamp() where account_id = account.id and id <> reservation.id and released_at is null;
  end if;
  update public.accounts set revoked_before = clock_timestamp() where id = account.id;
  update private.account_operations set state = 'auth_applied' where id = operation.id;
  return null;
end;
$$;



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
    or not a.active or a.application_status not in ('pending','needs_correction')
    or p.state='failed' or r.released_at is not null or p.generation<>r.proof_generation
    or o.id is null or o.generation<>a.operation_generation or o.state='failed'
    or (p.expires_at<=clock_timestamp() and o.state not in ('auth_applied','complete')) then raise exception 'Invalid replacement proof'; end if;
  if step='claim' and p.state='pending' then
    if o.state<>'pending' or a.identity_blocked then raise exception 'Change is resolving'; end if;
    update private.email_proofs set state='claimed',capability_hash=advance_replacement_proof.capability_hash,delivery_challenge=null,consumed_at=clock_timestamp() where id=p.id returning * into p;
    update private.account_operations set state='applying',verified_at=clock_timestamp(),started_at=clock_timestamp() where id=o.id returning * into o;
    update public.accounts set identity_blocked=true where id=a.id;
    update private.mail_work set state='discarded',lease_id=null,lease_until=null where proof_id=p.id and state in ('pending','sending');
  elsif step='finish' and p.state='claimed' then
    if o.state<>'auth_applied' or a.email<>r.email then raise exception 'Identity change is resolving'; end if;
    update private.account_operations set state='complete' where id=o.id returning * into o;
    update private.email_proofs set state='complete',delivery_challenge=null where id=p.id returning * into p;
    update public.accounts set identity_blocked=false where id=a.id;
  elsif step not in ('inspect','claim','finish') or p.state='pending' then raise exception 'Invalid replacement proof'; end if;
  return jsonb_build_object('proof_id',p.id,'account_id',a.id,'purpose',p.purpose,'native_type',p.native_type,'recipient',r.email,'state',p.state,'operation_id',o.id,'operation_state',o.state,'expires_at',p.expires_at);
end $$;


create or replace function private.approve_demo_application(project_ref text,target_id uuid,reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; target public.accounts; event_id uuid;
begin
  perform private.require_demo_project(project_ref);
  select * into actor from private.session_actor();
  perform 1 from public.accounts where id in (actor.id,target_id) order by id for update;
  select * into actor from public.accounts where id=actor.id;
  if actor.role is distinct from 'administrator' or actor.application_status is distinct from 'approved' or actor.id=target_id or not actor.active or actor.identity_blocked or not private.auth_session_is_live(actor.id,actor.revoked_before) then raise exception 'Approved Administrator required' using errcode='42501'; end if;
  select * into target from public.accounts where id=target_id for update;
  if target.id is null or not target.synthetic or not target.active or target.identity_blocked or target.role not in ('student','faculty')
    or not exists(select 1 from private.demo_slots s join private.account_reservations r on r.id=s.reservation_id where r.account_id=target_id)
    or not private.application_email_verified(target)
    or exists(select 1 from private.account_operations where account_id=target_id and purpose='identity_correction' and state not in ('complete','failed')) then raise exception 'Verified fixture application required'; end if;
  if target.application_status='approved' then return '{"approved":true}'::jsonb; end if;
  if target.application_status<>'pending' or reason is null or char_length(btrim(reason)) not between 1 and 2000 then raise exception 'Pending application and reason required'; end if;
  update public.accounts set application_status='approved' where id=target_id;
  insert into private.account_events(actor_id,account_id,event,reason) values(actor.id,target_id,'application_approved','Synthetic fixture decision: '||reason) returning id into event_id;
  insert into private.mail_work(event_id,recipient,kind) values(event_id,target.email,'approved');
  return '{"approved":true}'::jsonb;
end;
$$;
