create or replace function private.issue_auth_email(target_id uuid, recipient text, native_type text, native_verifier text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a public.accounts; r private.account_reservations; issued timestamptz := clock_timestamp(); challenge text; new_proof_id uuid; proof_purpose text;
begin
  if native_type not in ('signup','invite') or native_type is null or native_verifier is null or length(native_verifier) not between 16 and 256 then
    raise exception 'Unsupported email proof' using errcode='23514';
  end if;
  proof_purpose := case native_type when 'signup' then 'verification' else 'invitation' end;
  select * into a from public.accounts where id=target_id for update;
  select * into r from private.account_reservations where email=lower(btrim(recipient)) and released_at is null for update;
  if r.id is null or r.email is distinct from recipient or (a.id is not null and (a.email<>recipient or r.account_id is distinct from a.id))
      or (a.id is null and (r.account_id is not null or r.consumed_at is not null or r.expires_at<=issued))
      or (native_type='invite' and r.purpose<>'invitation') or (native_type='signup' and r.purpose<>'registration')
      or (a.id is not null and (not a.active or a.application_status<>'pending')) then
    raise exception 'Reserved recipient required' using errcode='23514';
  end if;
  if exists(select 1 from private.account_operations where account_id=target_id and state in ('applying','auth_applied')) then
    raise exception 'Operation in progress' using errcode='55000';
  end if;
  if exists(select 1 from private.email_proofs p where p.reservation_id=r.id and p.purpose=proof_purpose and p.created_at>issued-interval '60 seconds')
      or (select count(*) from private.email_proofs p where p.reservation_id=r.id and p.purpose=proof_purpose and p.created_at>issued-interval '1 hour')>=5 then
    raise exception 'Retry later' using errcode='55000';
  end if;
  update private.email_proofs set state='failed',native_verifier=null,delivery_challenge=null,capability_hash=null
    where reservation_id=r.id and state not in ('complete','failed');
  update private.mail_work set state='discarded',lease_id=null,lease_until=null
    where proof_id in(select id from private.email_proofs where reservation_id=r.id) and state in ('pending','sending');
  update private.account_operations set state='failed' where account_id=target_id and state in ('pending','verified');
  update private.account_reservations set proof_generation=proof_generation+1 where id=r.id returning * into r;
  challenge := encode(extensions.gen_random_bytes(32),'hex');
  insert into private.email_proofs(reservation_id,account_id,generation,purpose,challenge_hash,native_verifier,delivery_challenge,created_at,expires_at)
    values(r.id,target_id,r.proof_generation,proof_purpose,encode(extensions.digest(challenge,'sha256'),'hex'),native_verifier,challenge,issued,issued+interval '1800 seconds') returning id into new_proof_id;
  insert into private.mail_work(proof_id,recipient,kind) values(new_proof_id,r.email,proof_purpose);
  return '{"queued":true}'::jsonb;
end;
$$;
