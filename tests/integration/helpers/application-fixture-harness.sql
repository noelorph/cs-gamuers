-- TEST ONLY: exact target and run-owned accounts; never install in DEMO/production.
create table private.test_application_failures(account_id uuid primary key references public.accounts(id) on delete cascade);
alter table private.test_application_failures enable row level security;
revoke all on private.test_application_failures from public,anon,authenticated,service_role;
create function private.test_fail_application_mail() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if exists(select 1 from private.test_application_failures f join private.account_events e on e.account_id=f.account_id where e.id=new.event_id) then raise exception 'Synthetic outbox failure'; end if;
  return new;
end $$;
revoke all on function private.test_fail_application_mail() from public,anon,authenticated,service_role;
create trigger test_fail_application_mail before insert on private.mail_work for each row execute function private.test_fail_application_mail();
create function public.test_application_fixture(action text,run_id uuid,args jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
<<fixture>>
declare account_id uuid := (args->>'account_id')::uuid; key bigint; result jsonb;
begin
  if not exists(select 1 from private.environment where mode='test' and project_ref='ggiccvcrkydcimveyrfi') or args->>'project_ref' is distinct from 'ggiccvcrkydcimveyrfi' then raise exception 'Isolated test marker required'; end if;
  if not exists(select 1 from private.test_fixture_reservations f join private.account_reservations r on r.id=f.reservation_id where f.run_id=test_application_fixture.run_id and r.account_id=fixture.account_id) then raise exception 'Unknown fixture account'; end if;
  key := hashtextextended(account_id::text,7424);
  if action='demo_slot' then
    insert into private.demo_slots(slot,reservation_id) select (select slot from unnest(array['student_1','student_2','student_3']) as candidates(slot) where not exists(select 1 from private.demo_slots d where d.slot=candidates.slot) limit 1),r.id from private.account_reservations r where r.account_id=fixture.account_id and r.purpose='registration' and r.released_at is null;
  elsif action='fail_outbox' then
    insert into private.test_application_failures values(account_id) on conflict do nothing;
  elsif action='allow_outbox' then
    delete from private.test_application_failures where test_application_failures.account_id=fixture.account_id;
  elsif action='revoke_locked' then
    perform 1 from public.accounts where id=account_id for update;
    perform pg_advisory_xact_lock(key);
    perform pg_sleep(1);
    update public.accounts set revoked_before=clock_timestamp() where id=account_id;
  elsif action='lock_held' then
    if pg_try_advisory_xact_lock(key) then return 'false'; else return 'true'; end if;
  elsif action='inspect' then
    return jsonb_build_object('events',(select count(*) from private.account_events where account_events.account_id=fixture.account_id),
      'notices',(select count(*) from private.mail_work m join private.account_events e on e.id=m.event_id where e.account_id=fixture.account_id),
      'identity_blocked',(select identity_blocked from public.accounts where id=account_id));
  elsif action='claim_notices' then
    with due as (select m.id from private.mail_work m join private.account_events e on e.id=m.event_id where e.account_id=fixture.account_id and m.state in ('pending','failed') for update of m), claimed as (
      update private.mail_work m set state='sending',lease_id=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes',attempts=attempts+1 from due where m.id=due.id returning m.*
    ) select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'lease_id',m.lease_id,'recipient',m.recipient,'kind',m.kind,'reason',e.reason)),'[]') into result from claimed m join private.account_events e on e.id=m.event_id;
    return result;
  else raise exception 'Unknown fixture action'; end if;
  return '{}'::jsonb;
end $$;
revoke all on function public.test_application_fixture(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.test_application_fixture(text,uuid,jsonb) to service_role;
