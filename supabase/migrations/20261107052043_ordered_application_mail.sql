-- Preserve due order after enriching jobs with their saved decision reasons.
create or replace function private.claim_mail_work(batch_size integer default 10) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.reconcile_auth_mail();
  with due as (
    select id from private.mail_work where (state='pending' and due_at<=clock_timestamp()) or (state='sending' and lease_until<=clock_timestamp())
    order by due_at,id for update skip locked limit least(greatest(batch_size,1),20)
  ), claimed as (
    update private.mail_work m set state='sending',lease_id=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes',attempts=attempts+1
    from due where m.id=due.id returning m.*
  ) select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'lease_id',c.lease_id,'recipient',c.recipient,'kind',c.kind,'challenge',p.delivery_challenge,'expires_at',p.expires_at,'reason',e.reason) order by c.due_at,c.id),'[]') into result
    from claimed c left join private.email_proofs p on p.id=c.proof_id left join private.account_events e on e.id=c.event_id;
  return result;
end;
$$;
