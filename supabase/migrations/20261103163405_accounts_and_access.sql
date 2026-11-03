create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create type public.account_role as enum ('student', 'faculty', 'program_head', 'administrator');
create type public.application_status as enum ('pending', 'needs_correction', 'approved', 'rejected');

create table private.environment (
  singleton boolean primary key default true check (singleton),
  mode text not null default 'production' check (mode in ('production', 'demo', 'test')),
  project_ref text not null
);
alter table private.environment enable row level security;

create table public.accounts (
  id uuid primary key references auth.users(id),
  email text not null unique check (email = lower(btrim(email)) and char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 200),
  student_number text unique check (char_length(student_number) between 1 and 50),
  employee_number text check (char_length(employee_number) between 1 and 50),
  role public.account_role not null,
  application_status public.application_status not null default 'pending',
  active boolean not null default true,
  session_revoked_before timestamptz not null default '-infinity',
  operation_generation bigint not null default 0,
  identity_blocked boolean not null default false,
  synthetic boolean not null default false,
  check ((role = 'student' and student_number is not null and split_part(email, '@', 2) = 'caloocan.sti.edu.ph' and employee_number is null)
      or (role <> 'student' and student_number is null))
);
alter table public.accounts enable row level security;
revoke all on public.accounts from anon, authenticated, service_role;
grant select (id, role, application_status, active) on public.accounts to authenticated;

create table private.account_reservations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(btrim(email)) and char_length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 200),
  student_number text unique check (char_length(student_number) between 1 and 50),
  employee_number text check (char_length(employee_number) between 1 and 50),
  role public.account_role not null,
  purpose text not null check (purpose in ('registration', 'invitation', 'replacement')),
  synthetic boolean not null default false,
  expires_at timestamptz not null,
  account_id uuid references public.accounts(id),
  consumed_at timestamptz,
  check ((role = 'student' and student_number is not null and split_part(email, '@', 2) = 'caloocan.sti.edu.ph' and employee_number is null)
      or (role <> 'student' and student_number is null)),
  check (role not in ('administrator','program_head') or purpose in ('invitation','replacement'))
);
create index account_reservations_account_id_idx on private.account_reservations(account_id);
alter table private.account_reservations enable row level security;

create table private.account_operations (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id),
  generation bigint not null,
  purpose text not null check (purpose in ('password_reset','invitation_password','assisted_password','assisted_email','identity_correction')),
  state text not null check (state in ('pending','verified','applying','auth_applied','complete','failed')),
  verified_at timestamptz,
  expires_at timestamptz not null,
  reservation_id uuid references private.account_reservations(id),
  unique(account_id, generation)
);
create index account_operations_reservation_id_idx on private.account_operations(reservation_id);
alter table private.account_operations enable row level security;
revoke all on all tables in schema private from public, anon, authenticated, service_role;

create function private.create_account() returns trigger
language plpgsql security definer set search_path = '' as $$
declare reservation private.account_reservations;
begin
  if new.is_anonymous or new.is_sso_user or new.phone is not null or new.email is null then
    raise exception 'Unsupported account creation' using errcode = '23514';
  end if;
  select * into reservation from private.account_reservations r
  where r.email = lower(btrim(new.email))
    and (r.id::text = new.raw_app_meta_data ->> 'account_reservation_id'
      or (new.invited_at is not null and coalesce(new.encrypted_password, '') = '' and r.purpose = 'invitation'))
  for update;
  if not found or reservation.consumed_at is not null or reservation.account_id is not null
      or reservation.expires_at <= clock_timestamp() or reservation.purpose = 'replacement'
      or (reservation.synthetic and not exists (select 1 from private.environment where mode in ('demo','test')))
      or (coalesce(new.encrypted_password, '') = '' and not (new.invited_at is not null and reservation.purpose = 'invitation')) then
    raise exception 'Account reservation required' using errcode = '23514';
  end if;
  if (new.raw_user_meta_data ? 'full_name' and new.raw_user_meta_data ->> 'full_name' is distinct from reservation.full_name)
      or (new.raw_user_meta_data ? 'role' and new.raw_user_meta_data ->> 'role' is distinct from reservation.role::text)
      or (new.raw_user_meta_data ? 'student_number' and new.raw_user_meta_data ->> 'student_number' is distinct from reservation.student_number) then
    raise exception 'Reserved identity mismatch' using errcode = '23514';
  end if;
  insert into public.accounts (id,email,full_name,student_number,employee_number,role,synthetic)
    values (new.id,reservation.email,reservation.full_name,reservation.student_number,reservation.employee_number,reservation.role,reservation.synthetic);
  update private.account_reservations set consumed_at = clock_timestamp(), account_id = new.id where id = reservation.id;
  return new;
end;
$$;
revoke all on function private.create_account() from public, anon, authenticated, service_role;
create trigger create_canonical_account after insert on auth.users for each row execute function private.create_account();

create function private.session_actor() returns setof public.accounts
language sql stable security definer set search_path = '' as $$
  select a.* from public.accounts a
  join auth.users u on u.id = a.id
  join auth.sessions s on s.user_id = a.id and s.id::text = auth.jwt() ->> 'session_id'
  where a.id = auth.uid() and a.active and not a.identity_blocked
    and u.email_confirmed_at is not null and not coalesce(u.is_anonymous, false)
    and s.created_at > a.session_revoked_before
    and (s.not_after is null or s.not_after > now())
    and auth.jwt() -> 'amr' @> '[{"method":"password"}]'::jsonb
    and not exists (select 1 from jsonb_array_elements(auth.jwt() -> 'amr') method
      where method ->> 'method' not in ('password','totp','mfa/totp','mfa/phone'));
$$;
revoke all on function private.session_actor() from public, anon, authenticated, service_role;

create function private.current_actor() returns table(id uuid, role public.account_role, application_status public.application_status, active boolean)
language sql stable security definer set search_path = '' as $$
  select a.id,a.role,a.application_status,a.active from private.session_actor() a;
$$;
revoke all on function private.current_actor() from public, anon, service_role;
grant execute on function private.current_actor() to authenticated;

create function public.current_actor() returns table(id uuid, role public.account_role, application_status public.application_status, active boolean)
language sql stable security invoker set search_path = '' as $$
  select * from private.current_actor();
$$;
revoke all on function public.current_actor() from public, anon, service_role;
grant execute on function public.current_actor() to authenticated;

create function private.can_access_application() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.session_actor() a where a.application_status = 'approved');
$$;
revoke all on function private.can_access_application() from public, anon, service_role;
grant execute on function private.can_access_application() to authenticated;
create policy own_approved_account on public.accounts for select to authenticated
  using (id = (select auth.uid()) and (select private.can_access_application()));

create function private.fence_auth_credentials() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  final_user auth.users;
  account public.accounts;
  operation private.account_operations;
  reservation private.account_reservations;
  password_changed boolean := new.encrypted_password is distinct from old.encrypted_password;
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
revoke all on function private.fence_auth_credentials() from public, anon, authenticated, service_role;
create constraint trigger fence_auth_credentials after update on auth.users
  deferrable initially deferred for each row execute function private.fence_auth_credentials();
