create or replace function private.review_application(target_id uuid,expected_version bigint,request_id uuid,decision text,reason text,attestations jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare actor_id uuid; actor public.accounts; target public.accounts; previous private.account_events; payload jsonb; event_id uuid; next_status public.application_status;
begin
  select id into actor_id from private.session_actor();
  -- Both accounts are locked in stable order; authorization is checked against the locked current row.
  perform 1 from public.accounts where id in (actor_id,target_id) order by id for update;
  select * into actor from public.accounts where id=actor_id;
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

create or replace function private.save_application(expected_version bigint,full_name text,student_number text,employee_number text) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare a public.accounts;
begin
  perform pg_advisory_xact_lock(76420614002);
  select * into a from private.session_actor();
  select * into a from public.accounts where id=a.id for update;
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

create or replace function private.resubmit_application(expected_version bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.accounts;
begin
  select * into a from private.session_actor();
  select * into a from public.accounts where id=a.id for update;
  if a.id is null or not a.active or a.identity_blocked or not private.auth_session_is_live(a.id,a.revoked_before)
      or a.role not in ('student','faculty') or a.application_status<>'needs_correction' then raise exception 'Resubmission not permitted' using errcode='42501'; end if;
  if a.application_version is distinct from expected_version then raise exception 'Application updated' using errcode='40001'; end if;
  if not private.application_email_verified(a) or exists(select 1 from private.account_operations where account_id=a.id and purpose='identity_correction' and state not in ('complete','failed')) then raise exception 'Email verification required' using errcode='55000'; end if;
  update public.accounts set application_status='pending' where id=a.id returning * into a;
  insert into private.account_events(actor_id,account_id,event,reason) values(a.id,a.id,'application_resubmitted','Applicant resubmitted the corrected application.');
  return private.application_projection(a,false);
end $$;
