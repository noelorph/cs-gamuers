-- Managed Auth cannot grant its schema to a custom owner; these two read-only bridges
-- retain postgres ownership and expose no executable path to application client roles.
create function private.auth_user_for_guard(target_id uuid)
returns table(id uuid,email text,is_anonymous boolean,is_sso_user boolean,phone text,invited_at timestamptz,has_password boolean,raw_app_meta_data jsonb,raw_user_meta_data jsonb)
language sql stable security definer set search_path = '' as $$
  select u.id,u.email::text,u.is_anonymous,u.is_sso_user,u.phone,u.invited_at,
    coalesce(u.encrypted_password,'') <> '',
    coalesce((select jsonb_object_agg(key,value) from jsonb_each(u.raw_app_meta_data)
      where key in ('account_reservation_id','password_operation_id','identity_operation_id')),'{}'),
    coalesce((select jsonb_object_agg(key,value) from jsonb_each(u.raw_user_meta_data)
      where key in ('full_name','role','student_number')),'{}')
  from auth.users u where u.id=target_id and pg_trigger_depth()>0;
$$;
revoke all on function private.auth_user_for_guard(uuid) from public,anon,authenticated,service_role;
grant execute on function private.auth_user_for_guard(uuid) to account_guard_owner;

create function private.auth_session_is_live(target_id uuid, cutoff timestamptz) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u join auth.sessions s on s.user_id=u.id
    where u.id=target_id and u.id=auth.uid() and u.email_confirmed_at is not null
      and not coalesce(u.is_anonymous,false)
      and s.id::text=auth.jwt()->>'session_id' and s.created_at>cutoff
      and (s.not_after is null or s.not_after>now())
      and auth.jwt()->'amr' @> '[{"method":"password"}]'::jsonb
      and not exists(select 1 from jsonb_array_elements(auth.jwt()->'amr') method
        where method->>'method' not in ('password','totp','mfa/totp','mfa/phone'))
  );
$$;
revoke all on function private.auth_session_is_live(uuid,timestamptz) from public,anon,authenticated,service_role;
grant execute on function private.auth_session_is_live(uuid,timestamptz) to account_guard_owner;

create or replace function private.session_actor() returns setof public.accounts
language sql stable security definer set search_path = '' as $$
  select a.* from public.accounts a where a.active and not a.identity_blocked
    and private.auth_session_is_live(a.id,a.session_revoked_before);
$$;

create or replace function private.create_account() returns trigger
language plpgsql security definer set search_path = '' as $$
declare reservation private.account_reservations; final_user record;
begin
  select * into final_user from private.auth_user_for_guard(new.id);
  if not found then return null; end if;
  if final_user.is_anonymous or final_user.is_sso_user or final_user.phone is not null or final_user.email is null then
    raise exception 'Unsupported account creation' using errcode = '23514';
  end if;
  select * into reservation from private.account_reservations r
  where r.email = lower(btrim(final_user.email))
    and (r.id::text = final_user.raw_app_meta_data ->> 'account_reservation_id'
      or (final_user.invited_at is not null and not final_user.has_password and r.purpose = 'invitation'))
  for update;
  if not found or reservation.released_at is not null or reservation.consumed_at is not null or reservation.account_id is not null
      or reservation.expires_at <= clock_timestamp() or reservation.purpose = 'replacement'
      or (reservation.synthetic and not exists (select 1 from private.environment where mode in ('demo','test')))
      or (not final_user.has_password and not (final_user.invited_at is not null and reservation.purpose = 'invitation')) then
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
    update public.accounts set email = reservation.email where id = account.id;
    update private.account_reservations set consumed_at = clock_timestamp() where id = reservation.id;
    update private.account_reservations set released_at = clock_timestamp() where account_id = account.id and id <> reservation.id and released_at is null;
  end if;
  update public.accounts set session_revoked_before = clock_timestamp() where id = account.id;
  update private.account_operations set state = 'auth_applied' where id = operation.id;
  return null;
end;
$$;
