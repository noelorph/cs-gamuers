-- TEST ONLY. Install only alongside the existing isolated account harness.
create table private.test_course_dependencies (
  revision_id uuid primary key references public.course_revisions(id) on delete restrict
);
alter table private.test_course_dependencies enable row level security;
revoke all on private.test_course_dependencies from public,anon,authenticated,service_role;
create or replace function public.test_course_fixture(action text,run_id uuid,args jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
<<fixture>>
declare owned_ids uuid[]; course_id uuid; lock_marker text; deadline timestamptz;
begin
  if not exists(select 1 from private.environment where mode='test' and project_ref='ggiccvcrkydcimveyrfi')
    or args->>'project_ref' is distinct from 'ggiccvcrkydcimveyrfi' then raise exception 'Isolated test marker required'; end if;
  select array_agg(r.account_id) into owned_ids from private.test_fixture_reservations f join private.account_reservations r on r.id=f.reservation_id where f.run_id=test_course_fixture.run_id;
  if action='cleanup' then
    delete from private.test_course_dependencies where revision_id in(select r.id from public.course_revisions r join public.courses c on c.id=r.course_id where c.owner_id=any(owned_ids));
    delete from public.course_revisions where course_revisions.course_id in(select id from public.courses where owner_id=any(owned_ids));
    delete from public.courses where owner_id=any(owned_ids);
    return '{}'::jsonb;
  end if;
  if action='counts' then return jsonb_build_object('courses',(select count(*) from public.courses where owner_id=any(owned_ids)),'revisions',(select count(*) from public.course_revisions r join public.courses c on c.id=r.course_id where c.owner_id=any(owned_ids))); end if;
  if action in ('revoke_locked','actor_lock_state') then
    if ((args->>'account_id')::uuid=any(owned_ids)) is not true then raise exception 'Unknown fixture account'; end if;
    lock_marker := 'course-revoke:'||md5(run_id::text||':'||(args->>'account_id')::uuid::text);
    if action='actor_lock_state' then
      return jsonb_build_object('actorLockAcquired',exists(select 1 from pg_catalog.pg_stat_activity where application_name=lock_marker));
    end if;
    perform 1 from public.accounts where id=(args->>'account_id')::uuid for update;
    perform set_config('application_name',lock_marker,true);
    deadline := clock_timestamp()+interval '5 seconds';
    loop
      perform pg_stat_clear_snapshot();
      exit when exists(select 1 from pg_catalog.pg_stat_activity a
        where pg_backend_pid()=any(pg_blocking_pids(a.pid)) and a.query like '%update_course_draft%');
      if clock_timestamp()>=deadline then raise exception 'Expected draft writer did not block'; end if;
      perform pg_sleep(0.025);
    end loop;
    update public.accounts set active=false where id=(args->>'account_id')::uuid;
    return jsonb_build_object('actorLockAcquired',true,'writerBlocked',true);
  end if;
  course_id := (args->>'course_id')::uuid;
  if not exists(select 1 from public.courses c where c.id=course_id and c.owner_id=any(owned_ids)) then raise exception 'Unknown fixture course'; end if;
  if action='retained' then
    insert into private.test_course_dependencies select id from public.course_revisions r where r.course_id=fixture.course_id;
  elsif action='published' then update public.courses set published_at=clock_timestamp() where id=course_id;
  elsif action='submitted' then update public.course_revisions r set state='submitted' where r.course_id=fixture.course_id;
  else raise exception 'Unknown fixture action'; end if;
  return '{}'::jsonb;
end;
$$;
revoke all on function public.test_course_fixture(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.test_course_fixture(text,uuid,jsonb) to service_role;
