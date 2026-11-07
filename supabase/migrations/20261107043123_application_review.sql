grant create on schema private to account_guard_owner;
alter table public.accounts add column application_version bigint not null default 1;
alter table public.accounts add column applied_at timestamptz not null default clock_timestamp();
alter table private.account_events drop constraint account_events_account_id_event_key;
alter table private.account_events add column request_id uuid unique;
alter table private.account_events add column request_payload jsonb;
create index account_events_application_idx on private.account_events(account_id,created_at desc);
alter table private.mail_work drop constraint mail_work_kind_check;
alter table private.mail_work add constraint mail_work_kind_check check(kind in ('verification','invitation','approved','needs_correction','rejected','reopened','replacement'));

create table private.student_number_claims (
  student_number text primary key check(char_length(student_number) between 1 and 50),
  account_id uuid not null references public.accounts(id) on delete cascade
);
create index student_number_claims_account_idx on private.student_number_claims(account_id);
alter table private.student_number_claims enable row level security;
alter table private.student_number_claims owner to account_guard_owner;
revoke all on private.student_number_claims from public,anon,authenticated,service_role;
insert into private.student_number_claims select student_number,id from public.accounts where student_number is not null;

create function private.version_application() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if (new.full_name,new.student_number,new.employee_number,new.email,new.application_status) is distinct from
     (old.full_name,old.student_number,old.employee_number,old.email,old.application_status) then
    new.application_version := old.application_version+1;
  end if;
  return new;
end $$;
create trigger version_application before update on public.accounts for each row execute function private.version_application();

create function private.claim_student_number() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.student_number is null then return new; end if;
  insert into private.student_number_claims(student_number,account_id) values(new.student_number,new.id) on conflict do nothing;
  if not exists(select 1 from private.student_number_claims where student_number=new.student_number and account_id=new.id) then
    raise exception 'Administrator verification required for this number' using errcode='23505';
  end if;
  return new;
end $$;
create trigger claim_student_number after insert or update of student_number on public.accounts for each row execute function private.claim_student_number();

create function private.check_retained_number() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if new.student_number is not null and exists(select 1 from private.student_number_claims c
      where c.student_number=new.student_number and c.account_id is distinct from new.account_id) then
    raise exception 'Reserved identity' using errcode='23505';
  end if;
  return new;
end $$;
create trigger check_retained_number before insert or update of student_number on private.account_reservations for each row execute function private.check_retained_number();

create function private.application_email_verified(a public.accounts) returns boolean
language sql stable set search_path='' as $$
  select exists(select 1 from private.email_proofs p join private.account_reservations r on r.id=p.reservation_id
    where p.account_id=a.id and p.state='complete' and r.email=a.email);
$$;
create function private.application_projection(a public.accounts,delivery boolean) returns jsonb
language sql stable set search_path='' as $$
  select jsonb_build_object('id',a.id,'role',a.role,'full_name',a.full_name,'student_number',a.student_number,
    'employee_number',a.employee_number,'email',a.email,'status',a.application_status,'version',a.application_version,
    'applied_at',a.applied_at,'email_verified',private.application_email_verified(a),
    'history',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'event',e.event,'reason',e.reason,'created_at',e.created_at) order by e.created_at desc)
      from private.account_events e where e.account_id=a.id and e.event like 'application_%'),'[]'::jsonb))
    || case when delivery then jsonb_build_object('delivery_state',(select m.state from private.mail_work m join private.account_events e on e.id=m.event_id
        where e.account_id=a.id and e.event like 'application_%' order by e.created_at desc limit 1)) else '{}'::jsonb end;
$$;

create function private.application_details(target_id uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; target public.accounts;
begin
  select * into actor from private.session_actor();
  select * into target from public.accounts where id=coalesce(target_id,actor.id);
  if actor.id is null or target.id is null or target.role not in ('student','faculty')
      or (actor.id<>target.id and (actor.application_status<>'approved' or not target.active or
        not(actor.role='administrator' or (actor.role='faculty' and target.role='student')))) then
    raise exception 'Application access denied' using errcode='42501';
  end if;
  return private.application_projection(target,actor.role='administrator');
end $$;
create function public.application_details(target_id uuid default null) returns jsonb
language sql security invoker set search_path='' as $$ select private.application_details(target_id); $$;

create function private.list_applications(status public.application_status default 'pending',applicant_role public.account_role default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; result jsonb;
begin
  select * into actor from private.session_actor();
  if actor.id is null or actor.application_status<>'approved' or actor.role not in ('faculty','administrator') then
    raise exception 'Application access denied' using errcode='42501';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',a.id,'full_name',a.full_name,'role',a.role,'status',a.application_status,'applied_at',a.applied_at) order by a.applied_at,a.id),'[]'::jsonb)
    into result from public.accounts a where a.active and a.id<>actor.id and a.role in ('student','faculty')
      and (actor.role='administrator' or a.role='student') and a.application_status=list_applications.status
      and (applicant_role is null or a.role=applicant_role);
  return result;
end $$;
create function public.list_applications(status public.application_status default 'pending',applicant_role public.account_role default null) returns jsonb
language sql security invoker set search_path='' as $$ select private.list_applications(status,applicant_role); $$;

create function private.review_application(target_id uuid,expected_version bigint,request_id uuid,decision text,reason text,attestations jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare actor public.accounts; target public.accounts; previous private.account_events; payload jsonb; event_id uuid; next_status public.application_status;
begin
  -- Both accounts are locked in stable order; authorization is checked against the locked current row.
  perform 1 from public.accounts where id in (auth.uid(),target_id) order by id for update;
  select * into actor from public.accounts where id=auth.uid();
  select * into target from public.accounts where id=target_id;
  if actor.id is null or target.id is null or actor.id=target.id or not actor.active or actor.identity_blocked
    or not private.auth_session_is_live(actor.id,actor.revoked_before) or actor.application_status<>'approved'
    or not target.active or target.role not in ('student','faculty')
    or not(actor.role='administrator' or (actor.role='faculty' and target.role='student' and decision<>'reopen')) then
    raise exception 'Application access denied' using errcode='42501';
  end if;
  if request_id is null or expected_version is null or expected_version<1 or decision is null or decision not in ('approve','needs_correction','reject','reopen')
      or (decision<>'approve' and (reason is null or char_length(btrim(reason)) not between 1 and 2000))
      or attestations is null or jsonb_typeof(attestations)<>'object' then raise exception 'Invalid decision' using errcode='23514'; end if;
  reason := case when decision='approve' then null else btrim(reason) end;
  payload := jsonb_build_object('version',expected_version,'decision',decision,'reason',reason,'attestations',attestations);
  select * into previous from private.account_events e where e.request_id=review_application.request_id;
  if found then
    if previous.actor_id<>actor.id or previous.account_id<>target.id or previous.request_payload<>payload then
      raise exception 'Decision request changed' using errcode='23514';
    end if;
    return private.application_projection(target,actor.role='administrator');
  end if;
  if target.application_version<>expected_version then raise exception 'Application updated' using errcode='40001'; end if;
  if (decision='reopen' and target.application_status<>'rejected') or (decision<>'reopen' and target.application_status<>'pending') then
    raise exception 'Application cannot be reviewed in this state' using errcode='42501';
  end if;
  if target.identity_blocked or exists(select 1 from private.account_operations o where o.account_id=target.id and o.purpose='identity_correction' and o.state not in ('complete','failed')) then
    raise exception 'Replacement email pending' using errcode='55000';
  end if;
  if decision='approve' and (not private.application_email_verified(target)
    or (target.role='student' and not(attestations @> '{"enrollment":true}'::jsonb))
    or (target.role='faculty' and not(attestations @> '{"authorization":true,"employee_id":true,"email_owner":true}'::jsonb)))
    or (decision='reopen' and not(attestations @> '{"error_verified":true}'::jsonb)) then raise exception 'External verification required' using errcode='23514'; end if;
  next_status := case decision when 'approve' then 'approved' when 'reject' then 'rejected' when 'reopen' then 'pending' else 'needs_correction' end;
  update public.accounts set application_status=next_status where id=target.id returning * into target;
  insert into private.account_events(actor_id,account_id,event,reason,request_id,request_payload)
    values(actor.id,target.id,'application_'||case decision when 'approve' then 'approved' when 'reject' then 'rejected' when 'reopen' then 'reopened' else 'needs_correction' end,
      coalesce(reason,'Required external checks confirmed.'),request_id,payload) returning id into event_id;
  insert into private.mail_work(event_id,recipient,kind) values(event_id,target.email,case decision when 'approve' then 'approved' when 'reject' then 'rejected' when 'reopen' then 'reopened' else 'needs_correction' end);
  return private.application_projection(target,actor.role='administrator');
end $$;
create function public.review_application(target_id uuid,expected_version bigint,request_id uuid,decision text,reason text,attestations jsonb) returns jsonb
language sql security invoker set search_path='' as $$ select private.review_application(target_id,expected_version,request_id,decision,reason,attestations); $$;

create function private.save_application(expected_version bigint,full_name text,student_number text,employee_number text) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare a public.accounts;
begin
  perform pg_advisory_xact_lock(76420614002);
  select * into a from public.accounts where id=auth.uid() for update;
  if a.id is null or not a.active or a.identity_blocked or not private.auth_session_is_live(a.id,a.revoked_before)
      or a.role not in ('student','faculty') or a.application_status not in ('pending','needs_correction') then raise exception 'Correction not permitted' using errcode='42501'; end if;
  if a.application_version is distinct from expected_version then raise exception 'Application updated' using errcode='40001'; end if;
  if exists(select 1 from private.account_operations where account_id=a.id and purpose='identity_correction' and state not in ('complete','failed')) then raise exception 'Replacement email pending' using errcode='55000'; end if;
  full_name := btrim(full_name); student_number := nullif(btrim(student_number),''); employee_number := nullif(btrim(employee_number),'');
  if full_name is null or char_length(full_name) not between 1 and 200
      or (a.role='student' and (student_number is null or char_length(student_number)>50 or employee_number is not null))
      or (a.role='faculty' and (student_number is not null or char_length(employee_number)>50)) then raise exception 'Invalid correction' using errcode='23514'; end if;
  if student_number is not null and exists(select 1 from private.account_reservations r where r.student_number=save_application.student_number and r.released_at is null and r.account_id is distinct from a.id) then
    raise exception 'Administrator verification required for this number' using errcode='23505';
  end if;
  update public.accounts set full_name=save_application.full_name,student_number=save_application.student_number,employee_number=save_application.employee_number where id=a.id returning * into a;
  return private.application_projection(a,false);
end $$;
create function public.save_application(expected_version bigint,full_name text,student_number text,employee_number text) returns jsonb
language sql security invoker set search_path='' as $$ select private.save_application(expected_version,full_name,student_number,employee_number); $$;

create function private.resubmit_application(expected_version bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.accounts;
begin
  select * into a from public.accounts where id=auth.uid() for update;
  if a.id is null or not a.active or a.identity_blocked or not private.auth_session_is_live(a.id,a.revoked_before)
      or a.role not in ('student','faculty') or a.application_status<>'needs_correction' then raise exception 'Resubmission not permitted' using errcode='42501'; end if;
  if a.application_version is distinct from expected_version then raise exception 'Application updated' using errcode='40001'; end if;
  if not private.application_email_verified(a) or exists(select 1 from private.account_operations where account_id=a.id and purpose='identity_correction' and state not in ('complete','failed')) then raise exception 'Email verification required' using errcode='55000'; end if;
  update public.accounts set application_status='pending' where id=a.id returning * into a;
  insert into private.account_events(actor_id,account_id,event,reason) values(a.id,a.id,'application_resubmitted','Applicant resubmitted the corrected application.');
  return private.application_projection(a,false);
end $$;
create function public.resubmit_application(expected_version bigint) returns jsonb
language sql security invoker set search_path='' as $$ select private.resubmit_application(expected_version); $$;

do $$ declare f record; begin
  for f in select p.oid::regprocedure signature,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('private','public') and p.proname in ('version_application','claim_student_number','check_retained_number','application_email_verified','application_projection','application_details','list_applications','review_application','save_application','resubmit_application') loop
    if f.nspname='private' then execute format('alter function %s owner to account_guard_owner',f.signature); end if;
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
    if f.proname in ('application_details','list_applications','review_application','save_application','resubmit_application') then execute format('grant execute on function %s to authenticated',f.signature); end if;
  end loop;
end $$;
revoke create on schema private from account_guard_owner;
