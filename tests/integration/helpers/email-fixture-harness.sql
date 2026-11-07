-- TEST ONLY. Apply separately, after verifying exact isolated environment marker.
create or replace function public.test_email_fixture(action text,run_id uuid,args jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
<<fixture>>
declare p private.email_proofs; account_id uuid := (args->>'account_id')::uuid;
begin
  if not exists(select 1 from private.environment where mode='test' and project_ref='ggiccvcrkydcimveyrfi') or args->>'project_ref' is distinct from 'ggiccvcrkydcimveyrfi' then raise exception 'Isolated test marker required'; end if;
  if not exists(select 1 from private.test_fixture_reservations f join private.account_reservations r on r.id=f.reservation_id where f.run_id=test_email_fixture.run_id and r.account_id=fixture.account_id) then raise exception 'Unknown fixture account'; end if;
  select * into p from private.email_proofs where email_proofs.account_id=fixture.account_id order by generation desc limit 1;
  if action='decision_counts' then
    return (select jsonb_build_object('decisions',(select count(*) from private.account_events where account_events.account_id=fixture.account_id and event='application_approved'),'notices',count(*),'mail_state',min(m.state),'attempts',max(m.attempts)) from private.mail_work m join private.account_events e on e.id=m.event_id where e.account_id=fixture.account_id and e.event='application_approved');
  elsif action='hook_recovery' then
    return public.send_auth_email(jsonb_build_object('user',jsonb_build_object('id',account_id,'email',(select email from public.accounts where id=account_id)),'email_data',jsonb_build_object('email_action_type','recovery','token_hash','synthetic-native-hook-verifier')));
  elsif action='age_latest' then
    update private.email_proofs set created_at=clock_timestamp()-interval '61 seconds' where id=p.id;
  elsif action='age_operation' then
    update private.account_operations set started_at=clock_timestamp()-interval '121 seconds' where id=p.operation_id;
  elsif action='expire' then
    update private.email_proofs set expires_at=clock_timestamp() where id=p.id;
  elsif action='release_reservation' then
    update private.account_reservations set released_at=clock_timestamp() where id=p.reservation_id;
  elsif action='expire_mail_lease' then
    update private.mail_work set lease_until=clock_timestamp()-interval '1 second' where proof_id=p.id;
  elsif action='retry_notice' then
    update private.mail_work m set due_at=clock_timestamp()-interval '1 second'
      from private.account_events e where e.id=m.event_id and e.account_id=fixture.account_id;
  elsif action<>'inspect' then raise exception 'Unknown fixture action'; end if;
  return (select jsonb_build_object('id',id,'challenge',delivery_challenge,'lifetime_seconds',extract(epoch from (expires_at-created_at)),
    'employee_number',(select employee_number from public.accounts where accounts.id=fixture.account_id),'delivery_erased',delivery_challenge is null,'native_erased',native_verifier is null,'state',state)
    from private.email_proofs where id=p.id);
end;
$$;
revoke all on function public.test_email_fixture(text,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.test_email_fixture(text,uuid,jsonb) to service_role;
