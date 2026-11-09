-- TEST ONLY: actual PostgreSQL anonymous role, no secret-key-as-anonymous assumption.
begin;
do $$ begin
  if not exists(select 1 from private.environment where mode='test' and project_ref='ggiccvcrkydcimveyrfi') then raise exception 'Isolated TEST required'; end if;
end $$;
set local role anon;
do $$
declare statement text;
begin
  foreach statement in array array[
    'select 1 from public.courses',
    'select 1 from public.course_revisions',
    'select 1 from public.course_drafts',
    'insert into public.courses(id,owner_id) values(gen_random_uuid(),gen_random_uuid())',
    'update public.courses set owner_id=gen_random_uuid()',
    'delete from public.courses',
    'insert into public.course_revisions(course_id,title,description,outcomes,prior_knowledge) values(gen_random_uuid(),'''','''',''{}'','''')',
    'update public.course_revisions set version=version+1',
    'delete from public.course_revisions',
    'select public.create_course_draft(gen_random_uuid(),''{}'')',
    'select public.update_course_draft(gen_random_uuid(),1,''{}'')',
    'select public.delete_course_draft(gen_random_uuid(),1)'
  ] loop
    begin
      execute statement;
      raise exception 'Anonymous operation unexpectedly permitted';
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;
rollback;
select '12 anonymous SELECT/write/RPC denials passed; no writes retained' as result;
