create or replace function private.demo_setup_status(project_ref text,manifest_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.require_demo_project(project_ref);
  if exists(select 1 from private.demo_setup d where d.manifest_hash<>demo_setup_status.manifest_hash) then raise exception 'Original manifest required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('slot',s.slot,'reservation_id',r.id,'account_id',r.account_id,'status',a.application_status,'active',a.active,'identity_blocked',a.identity_blocked,
    'proof_complete',exists(select 1 from private.email_proofs p where p.account_id=a.id and p.state='complete'),
    'mail_state',(select m.state from private.mail_work m join private.email_proofs p on p.id=m.proof_id where p.reservation_id=r.id order by p.created_at desc limit 1))),'[]') into result
    from private.demo_slots s join private.account_reservations r on r.id=s.reservation_id left join public.accounts a on a.id=r.account_id;
  return result;
end;
$$;
