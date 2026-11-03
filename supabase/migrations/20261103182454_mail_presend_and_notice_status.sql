create function private.prepare_mail_work(work_id uuid,claim_id uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare m private.mail_work; p private.email_proofs; r private.account_reservations; a public.accounts;
begin
  select * into m from private.mail_work where id=work_id;
  if m.proof_id is not null then
    select * into p from private.email_proofs where id=m.proof_id;
    select * into a from public.accounts where id=p.account_id for update;
    select * into r from private.account_reservations where id=p.reservation_id for update;
    select * into p from private.email_proofs where id=m.proof_id for update;
  end if;
  select * into m from private.mail_work where id=work_id for update;
  if m.id is null or m.state<>'sending' or m.lease_id is distinct from claim_id or claim_id is null
    or m.lease_until is null or m.lease_until<=clock_timestamp() then return false; end if;
  if m.proof_id is not null and (p.id is null or a.id is null or r.id is null or p.state<>'pending'
    or p.expires_at<=clock_timestamp() or p.generation<>r.proof_generation or p.delivery_challenge is null
    or r.released_at is not null or a.application_status<>'pending' or not a.active
    or a.role<>r.role or a.email<>r.email or m.recipient<>r.email) then
    update private.mail_work set state='discarded',lease_id=null,lease_until=null where id=m.id;
    return false;
  end if;
  update private.mail_work set lease_until=clock_timestamp()+interval '2 minutes' where id=m.id;
  return true;
end;
$$;
create function public.prepare_mail_work(work_id uuid,claim_id uuid) returns boolean
language sql security invoker set search_path='' as $$ select private.prepare_mail_work(work_id,claim_id); $$;
grant create on schema private to account_guard_owner;
alter function private.prepare_mail_work(uuid,uuid) owner to account_guard_owner;
revoke create on schema private from account_guard_owner;
revoke all on function private.prepare_mail_work(uuid,uuid),public.prepare_mail_work(uuid,uuid) from public,anon,authenticated;
grant execute on function private.prepare_mail_work(uuid,uuid),public.prepare_mail_work(uuid,uuid) to service_role;

create or replace function private.demo_setup_status(project_ref text,manifest_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.require_demo_project(project_ref);
  if exists(select 1 from private.demo_setup d where d.manifest_hash<>demo_setup_status.manifest_hash) then raise exception 'Original manifest required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('slot',s.slot,'reservation_id',r.id,'account_id',r.account_id,'status',a.application_status,'active',a.active,'identity_blocked',a.identity_blocked,
    'proof_complete',exists(select 1 from private.email_proofs p where p.account_id=a.id and p.state='complete'),
    'mail_state',(select m.state from private.mail_work m join private.email_proofs p on p.id=m.proof_id where p.reservation_id=r.id order by p.created_at desc limit 1),
    'approval_mail_state',(select m.state from private.mail_work m join private.account_events e on e.id=m.event_id where e.account_id=a.id and e.event in ('application_approved','invitation_accepted') order by e.created_at desc limit 1))),'[]') into result
    from private.demo_slots s join private.account_reservations r on r.id=s.reservation_id left join public.accounts a on a.id=r.account_id;
  return result;
end;
$$;
