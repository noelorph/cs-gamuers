-- Guards own only application account records; they cannot write managed Auth records.
create role account_guard_owner nologin noinherit nobypassrls;
grant account_guard_owner to postgres;
grant usage, create on schema public, private to account_guard_owner;
grant usage on schema auth to account_guard_owner;
grant select (id,email,email_confirmed_at,is_anonymous,is_sso_user,phone,invited_at,encrypted_password,raw_app_meta_data,raw_user_meta_data) on auth.users to account_guard_owner;
grant select (id,user_id,created_at,not_after) on auth.sessions to account_guard_owner;
grant execute on function auth.uid(),auth.jwt() to account_guard_owner;

create or replace function private.create_account() returns trigger
language plpgsql security definer set search_path = '' as $$
declare reservation private.account_reservations; final_user record;
begin
  select id,email,is_anonymous,is_sso_user,phone,invited_at,encrypted_password,raw_app_meta_data,raw_user_meta_data into final_user from auth.users where id = new.id;
  if not found then return null; end if;
  if final_user.is_anonymous or final_user.is_sso_user or final_user.phone is not null or final_user.email is null then
    raise exception 'Unsupported account creation' using errcode = '23514';
  end if;
  select * into reservation from private.account_reservations r
  where r.email = lower(btrim(final_user.email))
    and (r.id::text = final_user.raw_app_meta_data ->> 'account_reservation_id'
      or (final_user.invited_at is not null and coalesce(final_user.encrypted_password, '') = '' and r.purpose = 'invitation'))
  for update;
  if not found or reservation.released_at is not null or reservation.consumed_at is not null or reservation.account_id is not null
      or reservation.expires_at <= clock_timestamp() or reservation.purpose = 'replacement'
      or (reservation.synthetic and not exists (select 1 from private.environment where mode in ('demo','test')))
      or (coalesce(final_user.encrypted_password, '') = '' and not (final_user.invited_at is not null and reservation.purpose = 'invitation')) then
    raise exception 'Account reservation required' using errcode = '23514';
  end if;
  if (final_user.raw_user_meta_data ? 'full_name' and final_user.raw_user_meta_data ->> 'full_name' is distinct from reservation.full_name)
      or (final_user.raw_user_meta_data ? 'role' and final_user.raw_user_meta_data ->> 'role' is distinct from reservation.role::text)
      or (final_user.raw_user_meta_data ? 'student_number' and final_user.raw_user_meta_data ->> 'student_number' is distinct from reservation.student_number) then
    raise exception 'Reserved identity mismatch' using errcode = '23514';
  end if;
  insert into public.accounts (id,email,full_name,student_number,employee_number,role,synthetic)
    values (final_user.id,reservation.email,reservation.full_name,reservation.student_number,reservation.employee_number,reservation.role,reservation.synthetic);
  update private.account_reservations set consumed_at = clock_timestamp(), account_id = final_user.id where id = reservation.id;
  return null;
end;
$$;


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
begin
  if not password_changed and not email_changed then return null; end if;
  if password_changed and email_changed then raise exception 'Separate credential operations required' using errcode = '23514'; end if;
  select id,email,encrypted_password,raw_app_meta_data into final_user from auth.users where id = new.id;
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
        or coalesce(final_user.encrypted_password, '') = '' then
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
    update public.accounts set email = reservation.email where id = account.id;
    update private.account_reservations set consumed_at = clock_timestamp() where id = reservation.id;
    update private.account_reservations set released_at = clock_timestamp() where account_id = account.id and id <> reservation.id and released_at is null;
  end if;
  update public.accounts set session_revoked_before = clock_timestamp() where id = account.id;
  update private.account_operations set state = 'auth_applied' where id = operation.id;
  return null;
end;
$$;

alter table public.accounts owner to account_guard_owner;
alter table private.environment owner to account_guard_owner;
alter table private.account_reservations owner to account_guard_owner;
alter table private.account_operations owner to account_guard_owner;
alter function private.create_account() owner to account_guard_owner;
alter function private.session_actor() owner to account_guard_owner;
alter function private.current_actor() owner to account_guard_owner;
alter function private.can_access_application() owner to account_guard_owner;
alter function private.fence_auth_credentials() owner to account_guard_owner;
alter function private.revoke_changed_account_sessions() owner to account_guard_owner;
revoke create on schema public, private from account_guard_owner;
