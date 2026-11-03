-- TEST ONLY: operator installs separately; never include in application migrations.
-- The caller must first verify TEST/DEMO isolation. Never apply this to another project.
insert into private.environment(singleton,mode,project_ref)
values (true,'test','ggiccvcrkydcimveyrfi');

create table private.test_fixture_reservations (
  run_id uuid not null,
  reservation_id uuid primary key references private.account_reservations(id) on delete cascade
);
alter table private.test_fixture_reservations enable row level security;
revoke all on private.test_fixture_reservations from public, anon, authenticated, service_role;

create function public.test_account_fixture(action text, run_id uuid, args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
<<fixture>>
declare
  reservation_id uuid;
  account_id uuid;
  operation_id uuid;
  generation bigint;
  ids jsonb;
  reservation_ids uuid[];
begin
  if not exists(select 1 from private.environment where mode='test' and project_ref='ggiccvcrkydcimveyrfi')
      or args ->> 'project_ref' is distinct from 'ggiccvcrkydcimveyrfi' then
    raise exception 'Isolated test marker required';
  end if;
  if action = 'reserve' then
    if lower(btrim(args ->> 'email')) not like 'fixture-' || left(run_id::text,8) || '-%@%' then raise exception 'Fixture namespace required'; end if;
    insert into private.account_reservations(email,full_name,student_number,role,purpose,synthetic,expires_at)
    values(lower(btrim(args ->> 'email')),'Synthetic integration fixture',case when args ->> 'role'='student' then args ->> 'student_number' end,
      (args ->> 'role')::public.account_role,
      case when args ->> 'role' in ('administrator','program_head') then 'invitation' else 'registration' end,
      true,now()+interval '30 minutes') returning id into reservation_id;
    insert into private.test_fixture_reservations values(run_id,reservation_id);
    return jsonb_build_object('reservation_id',reservation_id);
  end if;
  if action = 'security' then
    return jsonb_build_object(
      'client_bridge_access', exists(select 1 from pg_roles r cross join pg_proc p
        join pg_namespace n on n.oid=p.pronamespace where r.rolname in ('anon','authenticated','service_role')
        and n.nspname='private' and p.proname in ('auth_user_for_guard','auth_session_is_live')
        and has_function_privilege(r.oid,p.oid,'EXECUTE')),
      'guard_can_write_auth',has_table_privilege('account_guard_owner','auth.users','UPDATE'),
      'guard_login_or_bypass',(select rolcanlogin or rolbypassrls or rolsuper from pg_roles where rolname='account_guard_owner'),
      'client_guard_membership',exists(select 1 from pg_roles where rolname in ('anon','authenticated','service_role') and pg_has_role(oid,'account_guard_owner','MEMBER'))
    );
  end if;
  if action = 'cleanup' then
    select array_agg(f.reservation_id) into reservation_ids from private.test_fixture_reservations f where f.run_id=test_account_fixture.run_id;
    select coalesce(jsonb_agg(r.account_id) filter(where r.account_id is not null),'[]') into ids
      from private.account_reservations r join private.test_fixture_reservations f on f.reservation_id=r.id
      where f.run_id=test_account_fixture.run_id;
    delete from private.account_operations o where o.account_id in (select value::uuid from jsonb_array_elements_text(ids));
    delete from private.test_fixture_reservations where test_fixture_reservations.run_id=test_account_fixture.run_id;
    delete from private.account_reservations where id = any(reservation_ids);
    delete from public.accounts where id in (select value::uuid from jsonb_array_elements_text(ids));
    return ids;
  end if;
  account_id := (args ->> 'account_id')::uuid;
  if not exists(select 1 from private.test_fixture_reservations f join private.account_reservations r on r.id=f.reservation_id
    where f.run_id=test_account_fixture.run_id and r.account_id=fixture.account_id) then
    raise exception 'Unknown fixture account';
  end if;
  if action = 'state' then
    update public.accounts set application_status=coalesce((args ->> 'status')::public.application_status,application_status),
      active=coalesce((args ->> 'active')::boolean,active) where id=account_id;
  elsif action = 'cutoff' then
    update public.accounts set session_revoked_before=clock_timestamp() where id=account_id;
  elsif action = 'remove_session' then
    delete from auth.sessions where user_id=account_id and id=(args ->> 'session_id')::uuid;
  elsif action = 'operation' then
    update public.accounts set operation_generation=operation_generation+1 where id=account_id returning operation_generation into generation;
    insert into private.account_operations(account_id,generation,purpose,state,verified_at,expires_at)
    values(account_id,generation,coalesce(args ->> 'purpose','password_reset'),'applying',
      case when coalesce((args ->> 'verified')::boolean,true) then now() end,
      case when coalesce((args ->> 'expired')::boolean,false) then now()-interval '1 second' else now()+interval '30 minutes' end) returning id into operation_id;
    return jsonb_build_object('operation_id',operation_id);
  elsif action = 'identity_operation' then
    if args ->> 'email' not like 'fixture-' || left(run_id::text,8) || '-%@%' then raise exception 'Fixture namespace required'; end if;
    insert into private.account_reservations(email,full_name,student_number,employee_number,role,purpose,synthetic,expires_at,account_id)
      select args ->> 'email',full_name,student_number,employee_number,role,'replacement',true,now()+interval '30 minutes',id
      from public.accounts where id=account_id returning id into reservation_id;
    insert into private.test_fixture_reservations values(run_id,reservation_id);
    update public.accounts set operation_generation=operation_generation+1,identity_blocked=true where id=account_id returning operation_generation into generation;
    insert into private.account_operations(account_id,generation,purpose,state,verified_at,expires_at,reservation_id)
      values(account_id,generation,'identity_correction','applying',now(),now()+interval '30 minutes',reservation_id) returning id into operation_id;
    return jsonb_build_object('operation_id',operation_id);
  elsif action = 'cancel_operation' then
    update private.account_operations set state='failed' where id=(args ->> 'operation_id')::uuid and account_operations.account_id=fixture.account_id and state='applying';
  elsif action = 'inspect' then
    return (select jsonb_build_object('status',application_status,'role',role,'active',active,'email',email,'student_number',student_number,
      'operation_state',(select state from private.account_operations where id=(args ->> 'operation_id')::uuid and account_operations.account_id=a.id))
      from public.accounts a where id=account_id);
  else
    raise exception 'Unknown fixture action';
  end if;
  return '{}'::jsonb;
end;
$$;
revoke all on function public.test_account_fixture(text,uuid,jsonb) from public, anon, authenticated;
grant execute on function public.test_account_fixture(text,uuid,jsonb) to service_role;
