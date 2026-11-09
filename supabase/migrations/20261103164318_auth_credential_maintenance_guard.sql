create or replace function private.fence_auth_credentials() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  final_user auth.users;
  account public.accounts;
  operation private.account_operations;
  reservation private.account_reservations;
  password_changed boolean := coalesce(new.encrypted_password, '') is distinct from coalesce(old.encrypted_password, '');
  email_changed boolean := new.email is distinct from old.email;
  operation_marker text;
begin
  if not password_changed and not email_changed then return null; end if;
  if password_changed and email_changed then raise exception 'Separate credential operations required' using errcode = '23514'; end if;
  select * into final_user from auth.users where id = new.id;
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
        or reservation.id is null or reservation.purpose <> 'replacement' or reservation.account_id <> account.id
        or reservation.role <> account.role or reservation.consumed_at is not null
        or reservation.expires_at <= clock_timestamp() or lower(btrim(final_user.email)) <> reservation.email then
      raise exception 'Invalid identity operation' using errcode = '23514';
    end if;
    update public.accounts set email = reservation.email where id = account.id;
    update private.account_reservations set consumed_at = clock_timestamp() where id = reservation.id;
    delete from private.account_reservations where account_id = account.id and id <> reservation.id and purpose <> 'replacement';
  end if;
  update public.accounts set session_revoked_before = clock_timestamp() where id = account.id;
  update private.account_operations set state = 'auth_applied' where id = operation.id;
  return null;
end;
$$;
