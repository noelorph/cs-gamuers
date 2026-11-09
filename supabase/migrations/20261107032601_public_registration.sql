alter table private.account_reservations add column registration_capability_hash text
  unique check (registration_capability_hash ~ '^[a-f0-9]{64}$');

grant create on schema private to account_guard_owner;
create function private.reserve_registration(capability_hash text,email text,role public.account_role,full_name text,student_number text default null,employee_number text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare reservation private.account_reservations;
begin
  email := lower(btrim(email));
  full_name := btrim(full_name);
  student_number := nullif(btrim(student_number),'');
  employee_number := nullif(btrim(employee_number),'');
  if capability_hash is null or capability_hash !~ '^[a-f0-9]{64}$'
      or role is null or role not in ('student','faculty') then
    raise exception 'Invalid registration' using errcode='23514';
  end if;
  -- A short lock serializes identity reservations, never the external Auth call.
  perform pg_advisory_xact_lock(76420614002);
  select * into reservation from private.account_reservations r
    where r.registration_capability_hash=capability_hash for update;
  if found then
    if reservation.email is distinct from email or reservation.role is distinct from role
        or reservation.full_name is distinct from full_name
        or reservation.student_number is distinct from student_number
        or reservation.employee_number is distinct from employee_number
        or reservation.released_at is not null then
      raise exception 'Registration identity changed' using errcode='23514';
    end if;
    if reservation.account_id is null then
      update private.account_reservations r set expires_at=clock_timestamp()+interval '30 minutes' where r.id=reservation.id;
    end if;
  else
    if exists(select 1 from public.accounts a where a.email=email or (student_number is not null and a.student_number=student_number)) then return null; end if;
    insert into private.account_reservations(email,role,full_name,student_number,employee_number,purpose,registration_capability_hash,synthetic,expires_at)
      values(email,role,full_name,student_number,employee_number,'registration',capability_hash,
        exists(select 1 from private.environment where mode in ('demo','test')),clock_timestamp()+interval '30 minutes')
      on conflict do nothing returning * into reservation;
    if not found then return null; end if;
  end if;
  return jsonb_build_object('reservation_id',reservation.id,'account_id',reservation.account_id);
end $$;
alter function private.reserve_registration(text,text,public.account_role,text,text,text) owner to account_guard_owner;
revoke all on function private.reserve_registration(text,text,public.account_role,text,text,text) from public,anon,authenticated;
grant execute on function private.reserve_registration(text,text,public.account_role,text,text,text) to service_role;
create function public.reserve_registration(capability_hash text,email text,role public.account_role,full_name text,student_number text default null,employee_number text default null) returns jsonb
language sql security invoker set search_path='' as $$
  select private.reserve_registration(capability_hash,email,role,full_name,student_number,employee_number);
$$;
revoke all on function public.reserve_registration(text,text,public.account_role,text,text,text) from public,anon,authenticated;
grant execute on function public.reserve_registration(text,text,public.account_role,text,text,text) to service_role;

-- Unknown and ineligible addresses consume the same resend quota to avoid enumeration.
create table private.verification_requests (
  id bigint generated always as identity primary key,
  email_hash bytea not null,
  created_at timestamptz not null
);
create index verification_requests_email_idx on private.verification_requests(email_hash,created_at);
alter table private.verification_requests enable row level security;
alter table private.verification_requests owner to account_guard_owner;
revoke all on private.verification_requests from public,anon,authenticated,service_role;

create function private.request_registration_verification(email text) returns text
language plpgsql security definer set search_path='' as $$
declare requested_at timestamptz; digest bytea;
begin
  email := lower(btrim(email));
  if email is null or length(email)>254 or email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid email' using errcode='23514';
  end if;
  perform pg_advisory_xact_lock(76420614003);
  requested_at := clock_timestamp();
  digest := sha256(convert_to(email,'UTF8'));
  delete from private.verification_requests where created_at<=requested_at-interval '1 hour';
  if exists(select 1 from private.verification_requests v where v.email_hash=digest and v.created_at>requested_at-interval '60 seconds')
      or (select count(*) from private.verification_requests v where v.email_hash=digest)>=5 then return 'throttled'; end if;
  insert into private.verification_requests(email_hash,created_at) values(digest,requested_at);
  if exists(select 1 from public.accounts a join private.account_reservations r on r.account_id=a.id
      cross join lateral private.auth_user_for_guard(a.id) u
      where a.email=request_registration_verification.email and a.active and not a.identity_blocked
        and a.application_status='pending' and a.role in ('student','faculty')
        and r.email=a.email and r.purpose='registration' and r.released_at is null and u.email_confirmed_at is null) then
    return 'send';
  end if;
  return 'acknowledge';
end $$;
alter function private.request_registration_verification(text) owner to account_guard_owner;
revoke all on function private.request_registration_verification(text) from public,anon,authenticated;
grant execute on function private.request_registration_verification(text) to service_role;
create function public.request_registration_verification(email text) returns text
language sql security invoker set search_path='' as $$ select private.request_registration_verification(email); $$;
revoke all on function public.request_registration_verification(text) from public,anon,authenticated;
grant execute on function public.request_registration_verification(text) to service_role;
revoke create on schema private from account_guard_owner;
