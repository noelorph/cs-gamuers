-- Auth writes protected metadata and invitation state after INSERT, in the same transaction.
create or replace function private.create_account() returns trigger
language plpgsql security definer set search_path = '' as $$
declare reservation private.account_reservations; final_user auth.users;
begin
  select * into final_user from auth.users where id = new.id;
  if not found then return null; end if;
  if final_user.is_anonymous or final_user.is_sso_user or final_user.phone is not null or final_user.email is null then
    raise exception 'Unsupported account creation' using errcode = '23514';
  end if;
  select * into reservation from private.account_reservations r
  where r.email = lower(btrim(final_user.email))
    and (r.id::text = final_user.raw_app_meta_data ->> 'account_reservation_id'
      or (final_user.invited_at is not null and coalesce(final_user.encrypted_password, '') = '' and r.purpose = 'invitation'))
  for update;
  if not found or reservation.consumed_at is not null or reservation.account_id is not null
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
revoke all on function private.create_account() from public, anon, authenticated, service_role;
drop trigger create_canonical_account on auth.users;
create constraint trigger create_canonical_account after insert on auth.users
  deferrable initially deferred for each row execute function private.create_account();
