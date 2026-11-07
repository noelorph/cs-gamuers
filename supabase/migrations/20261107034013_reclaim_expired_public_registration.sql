create or replace function private.reserve_registration(capability_hash text,email text,role public.account_role,full_name text,student_number text default null,employee_number text default null) returns jsonb
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
    -- UPDATE rechecks these predicates after any concurrent Auth reservation lock.
    update private.account_reservations r set released_at=clock_timestamp()
      where (r.email=email or (student_number is not null and r.student_number=student_number))
        and r.purpose='registration' and r.registration_capability_hash is not null
        and r.released_at is null and r.account_id is null and r.consumed_at is null
        and r.expires_at<=clock_timestamp();
    if exists(select 1 from public.accounts a where a.email=email or (student_number is not null and a.student_number=student_number)) then return null; end if;
    insert into private.account_reservations(email,role,full_name,student_number,employee_number,purpose,registration_capability_hash,synthetic,expires_at)
      values(email,role,full_name,student_number,employee_number,'registration',capability_hash,
        exists(select 1 from private.environment where mode in ('demo','test')),clock_timestamp()+interval '30 minutes')
      on conflict do nothing returning * into reservation;
    if not found then return null; end if;
  end if;
  return jsonb_build_object('reservation_id',reservation.id,'account_id',reservation.account_id);
end $$;
