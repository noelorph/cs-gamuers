create or replace function private.approve_demo_application(project_ref text,target_id uuid,reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; target public.accounts; event_id uuid;
begin
  perform private.require_demo_project(project_ref);
  select * into actor from private.session_actor();
  perform 1 from public.accounts where id in (actor.id,target_id) order by id for update;
  select * into actor from public.accounts where id=actor.id;
  if actor.role is distinct from 'administrator' or actor.application_status is distinct from 'approved' or actor.id=target_id or not actor.active or actor.identity_blocked or not private.auth_session_is_live(actor.id,actor.revoked_before) then raise exception 'Approved Administrator required' using errcode='42501'; end if;
  select * into target from public.accounts where id=target_id for update;
  if target.id is null or not target.synthetic or not target.active or target.identity_blocked or target.role not in ('student','faculty')
    or not exists(select 1 from private.demo_slots s join private.account_reservations r on r.id=s.reservation_id where r.account_id=target_id)
    or not private.application_email_verified(target)
    or exists(select 1 from private.account_operations where account_id=target_id and purpose='identity_correction' and state not in ('complete','failed')) then raise exception 'Verified fixture application required'; end if;
  if target.application_status='approved' then return '{"approved":true}'::jsonb; end if;
  if target.application_version<>1 then raise exception 'Use versioned application review after a correction' using errcode='PT409'; end if;
  if target.application_status<>'pending' or reason is null or char_length(btrim(reason)) not between 1 and 2000 then raise exception 'Pending application and reason required'; end if;
  update public.accounts set application_status='approved' where id=target_id;
  insert into private.account_events(actor_id,account_id,event,reason) values(actor.id,target_id,'application_approved','Synthetic fixture decision: '||reason) returning id into event_id;
  insert into private.mail_work(event_id,recipient,kind) values(event_id,target.email,'approved');
  return '{"approved":true}'::jsonb;
end;
$$;
