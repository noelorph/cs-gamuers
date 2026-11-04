grant create on schema public,private to account_guard_owner;
-- Stable courses and their initial editable revision; no publication operation is exposed.
create table public.courses (
  id uuid primary key,
  owner_id uuid not null references public.accounts(id) on delete restrict,
  published_at timestamptz,
  archived_at timestamptz
);
create index courses_owner_id_idx on public.courses(owner_id);
create function private.valid_draft_outcomes(outcomes text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(array_ndims(outcomes),1)=1 and not exists (
    select 1 from unnest(outcomes) outcome where outcome is null or char_length(outcome)>500
  );
$$;
create table public.course_revisions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete restrict,
  revision_number integer not null default 1 check(revision_number>0),
  state text not null default 'draft' check(state in ('draft','submitted','published','rejected','changes_requested')),
  version integer not null default 1 check(version>0),
  title text not null check(char_length(title)<=200),
  description text not null check(char_length(description)<=2000),
  primary_topic text check(primary_topic in ('Programming fundamentals','Data structures and algorithms','Web development','Mobile development','Databases','Computer systems and networking','Software engineering','Cybersecurity','Data science','Artificial intelligence and machine learning')),
  difficulty text check(difficulty in ('Beginner','Intermediate','Advanced')),
  outcomes text[] not null check(private.valid_draft_outcomes(outcomes)),
  prior_knowledge text not null check(char_length(prior_knowledge)<=2000),
  estimated_hours double precision check(estimated_hours>0 and estimated_hours<'Infinity'::double precision),
  updated_at timestamptz not null default clock_timestamp(),
  unique(course_id,revision_number)
);
create unique index course_revisions_one_draft_idx on public.course_revisions(course_id) where state='draft';
alter table public.courses enable row level security;
alter table public.course_revisions enable row level security;
alter table public.courses owner to account_guard_owner;
alter table public.course_revisions owner to account_guard_owner;
revoke all on public.courses,public.course_revisions from public,anon,authenticated,service_role;
grant select on public.courses,public.course_revisions to authenticated;
create policy course_draft_read on public.courses for select to authenticated using (
  exists(select 1 from public.current_actor() a where a.application_status='approved'
    and (a.role='program_head' or (a.role='faculty' and a.id=owner_id)))
);
create policy revision_draft_read on public.course_revisions for select to authenticated using (
  exists(select 1 from public.courses c where c.id=course_id)
);

create function private.require_draft_author() returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid; actor_role public.account_role;
begin
  select a.id into actor_id from private.current_actor() a;
  if actor_id is null then raise exception 'Authentication required' using errcode='PT401'; end if;
  perform 1 from public.accounts where id=actor_id for update;
  -- Recheck after waiting for revocation/approval to commit on the shared account lock.
  if not private.can_access_application() then raise exception 'Authentication required' using errcode='PT401'; end if;
  select a.role into actor_role from private.current_actor() a;
  if actor_role is distinct from 'faculty' then raise exception 'Faculty required' using errcode='PT403'; end if;
  return actor_id;
end;
$$;
create function private.draft_details_valid(details jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(details) is distinct from 'object' or octet_length(details::text)>1048576
    or jsonb_typeof(details->'title') is distinct from 'string' or char_length(details->>'title')>200
    or jsonb_typeof(details->'description') is distinct from 'string' or char_length(details->>'description')>2000
    or jsonb_typeof(details->'priorKnowledge') is distinct from 'string' or char_length(details->>'priorKnowledge')>2000
    or jsonb_typeof(details->'outcomes') is distinct from 'array'
    or not details ?& array['primaryTopic','difficulty','estimatedHours'] then return false; end if;
  if exists(select 1 from jsonb_array_elements(details->'outcomes') o where jsonb_typeof(o)<>'string' or char_length(o#>>'{}')>500) then return false; end if;
  if details->'primaryTopic'<>'null'::jsonb and (jsonb_typeof(details->'primaryTopic')<>'string' or details->>'primaryTopic' not in ('Programming fundamentals','Data structures and algorithms','Web development','Mobile development','Databases','Computer systems and networking','Software engineering','Cybersecurity','Data science','Artificial intelligence and machine learning')) then return false; end if;
  if details->'difficulty'<>'null'::jsonb and (jsonb_typeof(details->'difficulty')<>'string' or details->>'difficulty' not in ('Beginner','Intermediate','Advanced')) then return false; end if;
  if details->'estimatedHours'<>'null'::jsonb and (jsonb_typeof(details->'estimatedHours')<>'number' or (details->>'estimatedHours')::double precision<=0 or (details->>'estimatedHours')::double precision>='Infinity'::double precision) then return false; end if;
  return true;
exception when numeric_value_out_of_range or invalid_text_representation then return false;
end;
$$;
create function private.course_draft_value(course public.courses, revision public.course_revisions) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('id',course.id,'ownerId',course.owner_id,'revisionId',revision.id,'version',revision.version,'updatedAt',revision.updated_at,
    'details',jsonb_build_object('title',revision.title,'description',revision.description,'primaryTopic',revision.primary_topic,'difficulty',revision.difficulty,'outcomes',revision.outcomes,'priorKnowledge',revision.prior_knowledge,'estimatedHours',revision.estimated_hours));
$$;
create function private.create_course_draft(course_id uuid, details jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid; course public.courses; revision public.course_revisions;
begin
  actor_id := private.require_draft_author();
  if course_id is null or not private.draft_details_valid(details) then return '{"ok":false,"code":"validation"}'; end if;
  insert into public.courses(id,owner_id) values(course_id,actor_id) on conflict(id) do nothing;
  select c.* into course from public.courses c where c.id=course_id for update;
  if course.owner_id<>actor_id or course.published_at is not null or course.archived_at is not null then return '{"ok":false,"code":"unavailable"}'; end if;
  select r.* into revision from public.course_revisions r where r.course_id=create_course_draft.course_id and r.revision_number=1 for update;
  if found then
    if revision.state<>'draft' then return '{"ok":false,"code":"unavailable"}'; end if;
  else
    insert into public.course_revisions(course_id,title,description,primary_topic,difficulty,outcomes,prior_knowledge,estimated_hours)
      values(course_id,details->>'title',details->>'description',details->>'primaryTopic',details->>'difficulty',array(select jsonb_array_elements_text(details->'outcomes')),details->>'priorKnowledge',(details->>'estimatedHours')::double precision) returning * into revision;
  end if;
  return jsonb_build_object('ok',true,'value',private.course_draft_value(course,revision));
end;
$$;
create function private.update_course_draft(course_id uuid, expected_version integer, details jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid; course public.courses; revision public.course_revisions;
begin
  actor_id := private.require_draft_author();
  if expected_version is null or expected_version<1 or not private.draft_details_valid(details) then return '{"ok":false,"code":"validation"}'; end if;
  select c.* into course from public.courses c where c.id=course_id for update;
  if not found or course.owner_id<>actor_id or course.published_at is not null or course.archived_at is not null then return '{"ok":false,"code":"unavailable"}'; end if;
  select r.* into revision from public.course_revisions r where r.course_id=update_course_draft.course_id and r.state='draft' for update;
  if not found then return '{"ok":false,"code":"unavailable"}'; end if;
  if revision.version<>expected_version then return '{"ok":false,"code":"conflict"}'; end if;
  update public.course_revisions set title=details->>'title', description=details->>'description',primary_topic=details->>'primaryTopic',difficulty=details->>'difficulty',outcomes=array(select jsonb_array_elements_text(details->'outcomes')),prior_knowledge=details->>'priorKnowledge',estimated_hours=(details->>'estimatedHours')::double precision,version=version+1,updated_at=clock_timestamp() where id=revision.id returning * into revision;
  return jsonb_build_object('ok',true,'value',private.course_draft_value(course,revision));
end;
$$;
create function private.delete_course_draft(course_id uuid, expected_version integer) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor_id uuid; course public.courses; revision public.course_revisions;
begin
  actor_id := private.require_draft_author();
  if expected_version is null or expected_version<1 then return '{"ok":false,"code":"validation"}'; end if;
  select c.* into course from public.courses c where c.id=course_id for update;
  if not found or course.owner_id<>actor_id or course.published_at is not null or course.archived_at is not null then return '{"ok":false,"code":"unavailable"}'; end if;
  select r.* into revision from public.course_revisions r where r.course_id=delete_course_draft.course_id and r.state='draft' for update;
  if not found then return '{"ok":false,"code":"unavailable"}'; end if;
  if revision.version<>expected_version then return '{"ok":false,"code":"conflict"}'; end if;
  if exists(select 1 from public.course_revisions r where r.course_id=delete_course_draft.course_id and r.id<>revision.id) then return '{"ok":false,"code":"unavailable"}'; end if;
  delete from public.course_revisions where id=revision.id;
  delete from public.courses where id=course_id;
  return '{"ok":true,"value":null}';
exception when foreign_key_violation then return '{"ok":false,"code":"unavailable"}';
end;
$$;
create function public.create_course_draft(course_id uuid, details jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select private.create_course_draft(course_id,details); $$;
create function public.update_course_draft(course_id uuid, expected_version integer, details jsonb) returns jsonb
language sql security invoker set search_path = '' as $$ select private.update_course_draft(course_id,expected_version,details); $$;
create function public.delete_course_draft(course_id uuid, expected_version integer) returns jsonb
language sql security invoker set search_path = '' as $$ select private.delete_course_draft(course_id,expected_version); $$;

alter function private.valid_draft_outcomes(text[]) owner to account_guard_owner;
alter function private.require_draft_author() owner to account_guard_owner;
alter function private.draft_details_valid(jsonb) owner to account_guard_owner;
alter function private.course_draft_value(public.courses,public.course_revisions) owner to account_guard_owner;
alter function private.create_course_draft(uuid,jsonb) owner to account_guard_owner;
alter function private.update_course_draft(uuid,integer,jsonb) owner to account_guard_owner;
alter function private.delete_course_draft(uuid,integer) owner to account_guard_owner;
revoke all on function private.valid_draft_outcomes(text[]),private.require_draft_author(),private.draft_details_valid(jsonb),private.course_draft_value(public.courses,public.course_revisions) from public,anon,authenticated,service_role;
revoke all on function private.create_course_draft(uuid,jsonb),private.update_course_draft(uuid,integer,jsonb),private.delete_course_draft(uuid,integer),public.create_course_draft(uuid,jsonb),public.update_course_draft(uuid,integer,jsonb),public.delete_course_draft(uuid,integer) from public,anon,authenticated,service_role;
grant execute on function private.create_course_draft(uuid,jsonb),private.update_course_draft(uuid,integer,jsonb),private.delete_course_draft(uuid,integer),public.create_course_draft(uuid,jsonb),public.update_course_draft(uuid,integer,jsonb),public.delete_course_draft(uuid,integer) to authenticated;

create view public.course_drafts with(security_invoker=true) as
select c.id,c.owner_id,r.id as revision_id,r.version,r.updated_at,
  jsonb_build_object('title',r.title,'description',r.description,'primaryTopic',r.primary_topic,'difficulty',r.difficulty,'outcomes',r.outcomes,'priorKnowledge',r.prior_knowledge,'estimatedHours',r.estimated_hours) as details
from public.courses c join public.course_revisions r on r.course_id=c.id
where c.published_at is null and c.archived_at is null and r.state='draft';
revoke all on public.course_drafts from public,anon,authenticated,service_role;
grant select on public.course_drafts to authenticated;

revoke create on schema public,private from account_guard_owner;
