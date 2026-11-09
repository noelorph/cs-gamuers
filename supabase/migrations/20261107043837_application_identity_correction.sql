grant create on schema private to account_guard_owner;
alter table private.email_proofs drop constraint email_proofs_purpose_check;
alter table private.email_proofs add constraint email_proofs_purpose_check check(purpose in ('verification','invitation','replacement'));
alter table private.email_proofs drop constraint email_proofs_native_type_check;
alter table private.email_proofs add constraint email_proofs_native_type_check check(native_type in ('signup','invite','recovery','opaque'));

create function private.request_application_email(expected_version bigint,email text) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare a public.accounts; r private.account_reservations; p_id uuid; op_id uuid; challenge text; issued timestamptz := clock_timestamp();
begin
  perform pg_advisory_xact_lock(76420614002);
  select * into a from private.session_actor();
  select * into a from public.accounts where id=a.id for update;
  if a.id is null or not a.active or a.identity_blocked or not private.auth_session_is_live(a.id,a.revoked_before)
    or a.role not in ('student','faculty') or a.application_status not in ('pending','needs_correction') then raise exception 'Correction not permitted' using errcode='42501'; end if;
  if a.application_version is distinct from expected_version then raise exception 'Application updated' using errcode='PT409'; end if;
  email := lower(btrim(email));
  if email is null or char_length(email)>254 or email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or email=a.email or (a.role='student' and split_part(email,'@',2)<>'caloocan.sti.edu.ph') then raise exception 'Invalid email' using errcode='23514'; end if;
  if exists(select 1 from private.account_operations where account_id=a.id and state in ('applying','auth_applied')) then raise exception 'Change is resolving' using errcode='55000'; end if;
  if exists(select 1 from private.email_proofs p join private.account_reservations r on r.id=p.reservation_id where p.purpose='replacement' and r.email=email and p.created_at>issued-interval '60 seconds')
    or (select count(*) from private.email_proofs p join private.account_reservations r on r.id=p.reservation_id where p.purpose='replacement' and r.email=email and p.created_at>issued-interval '1 hour')>=5 then raise exception 'Retry later' using errcode='PT429'; end if;
  if exists(select 1 from public.accounts where accounts.email=request_application_email.email) then raise exception 'Email unavailable' using errcode='23514'; end if;
  update private.account_operations set state='failed' where account_id=a.id and purpose='identity_correction' and state in ('pending','verified');
  update private.email_proofs set state='failed',delivery_challenge=null,capability_hash=null where account_id=a.id and purpose='replacement' and state not in ('complete','failed');
  update private.account_reservations set released_at=issued where account_id=a.id and purpose='replacement' and consumed_at is null and released_at is null;
  insert into private.account_reservations(email,full_name,student_number,employee_number,role,purpose,synthetic,expires_at,account_id,proof_generation)
    values(email,a.full_name,a.student_number,a.employee_number,a.role,'replacement',a.synthetic,issued+interval '30 minutes',a.id,1) returning * into r;
  update public.accounts set operation_generation=operation_generation+1,application_version=application_version+1 where id=a.id returning * into a;
  insert into private.account_operations(account_id,generation,purpose,state,expires_at,reservation_id)
    values(a.id,a.operation_generation,'identity_correction','pending',r.expires_at,r.id) returning id into op_id;
  challenge := encode(extensions.gen_random_bytes(32),'hex');
  insert into private.email_proofs(reservation_id,account_id,generation,purpose,native_type,challenge_hash,delivery_challenge,created_at,expires_at,operation_id)
    values(r.id,a.id,1,'replacement','opaque',encode(extensions.digest(challenge,'sha256'),'hex'),challenge,issued,r.expires_at,op_id) returning id into p_id;
  insert into private.mail_work(proof_id,recipient,kind) values(p_id,r.email,'replacement');
  return private.application_projection(a,false);
end $$;
create function public.request_application_email(expected_version bigint,email text) returns jsonb
language sql security invoker set search_path='' as $$ select private.request_application_email(expected_version,email); $$;

create function private.cancel_application_email(expected_version bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare a public.accounts;
begin
  select * into a from private.session_actor();
  select * into a from public.accounts where id=a.id for update;
  if a.id is null or not a.active or a.identity_blocked or not private.auth_session_is_live(a.id,a.revoked_before)
    or a.application_status not in ('pending','needs_correction') then raise exception 'Correction not permitted' using errcode='42501'; end if;
  if a.application_version is distinct from expected_version then raise exception 'Application updated' using errcode='PT409'; end if;
  if exists(select 1 from private.account_operations where account_id=a.id and state in ('applying','auth_applied')) then raise exception 'Change is resolving' using errcode='55000'; end if;
  update private.account_operations set state='failed' where account_id=a.id and purpose='identity_correction' and state in ('pending','verified');
  update private.email_proofs set state='failed',delivery_challenge=null,capability_hash=null where account_id=a.id and purpose='replacement' and state not in ('complete','failed');
  update private.account_reservations set released_at=clock_timestamp() where account_id=a.id and purpose='replacement' and consumed_at is null and released_at is null;
  update public.accounts set application_version=application_version+1 where id=a.id returning * into a;
  return private.application_projection(a,false);
end $$;
create function public.cancel_application_email(expected_version bigint) returns jsonb
language sql security invoker set search_path='' as $$ select private.cancel_application_email(expected_version); $$;

create function private.advance_replacement_proof(proof_id uuid,capability_hash text,step text) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare a public.accounts; r private.account_reservations; p private.email_proofs; o private.account_operations;
begin
  select * into p from private.email_proofs where id=proof_id;
  select * into a from public.accounts where id=p.account_id for update;
  select * into r from private.account_reservations where id=p.reservation_id for update;
  select * into p from private.email_proofs where id=proof_id for update;
  select * into o from private.account_operations where id=p.operation_id for update;
  if p.id is null or p.purpose<>'replacement' or capability_hash is null or capability_hash !~ '^[a-f0-9]{64}$'
    or (p.capability_hash is not null and p.capability_hash<>capability_hash)
    or not a.active or a.application_status not in ('pending','needs_correction')
    or p.state='failed' or r.released_at is not null or p.generation<>r.proof_generation
    or o.id is null or o.generation<>a.operation_generation or o.state='failed'
    or (p.expires_at<=clock_timestamp() and o.state not in ('auth_applied','complete')) then raise exception 'Invalid replacement proof'; end if;
  if step='claim' and p.state='pending' then
    if o.state<>'pending' or a.identity_blocked then raise exception 'Change is resolving'; end if;
    update private.email_proofs set state='claimed',capability_hash=advance_replacement_proof.capability_hash,delivery_challenge=null,consumed_at=clock_timestamp() where id=p.id returning * into p;
    update private.account_operations set state='applying',verified_at=clock_timestamp(),started_at=clock_timestamp() where id=o.id returning * into o;
    update public.accounts set identity_blocked=true where id=a.id;
    update private.mail_work set state='discarded',lease_id=null,lease_until=null where proof_id=p.id and state in ('pending','sending');
  elsif step='finish' and p.state='claimed' then
    if o.state<>'auth_applied' or a.email<>r.email then raise exception 'Identity change is resolving'; end if;
    update private.account_operations set state='complete' where id=o.id returning * into o;
    update private.email_proofs set state='complete',delivery_challenge=null where id=p.id returning * into p;
    update public.accounts set identity_blocked=false where id=a.id;
    insert into private.account_events(actor_id,account_id,event,reason) values(a.id,a.id,'application_email_changed','Applicant verified a replacement email.');
  elsif step not in ('inspect','claim','finish') or p.state='pending' then raise exception 'Invalid replacement proof'; end if;
  return jsonb_build_object('proof_id',p.id,'account_id',a.id,'purpose',p.purpose,'native_type',p.native_type,'recipient',r.email,'state',p.state,'operation_id',o.id,'operation_state',o.state,'expires_at',p.expires_at);
end $$;

create function private.correct_student_number(target_id uuid,expected_version bigint,student_number text,replacement_number text,reason text,error_verified boolean) returns jsonb
language plpgsql security definer set search_path='' as $$
#variable_conflict use_variable
declare actor_id uuid; actor public.accounts; a public.accounts;
begin
  perform pg_advisory_xact_lock(76420614002);
  select id into actor_id from private.session_actor();
  perform 1 from public.accounts where id in (actor_id,target_id) order by id for update;
  select * into actor from public.accounts where id=actor_id;
  select * into a from public.accounts where id=target_id;
  if actor.id is null or a.id is null or actor.id=a.id or not actor.active or actor.identity_blocked
    or not private.auth_session_is_live(actor.id,actor.revoked_before) or actor.role<>'administrator' or actor.application_status<>'approved'
    or not a.active or a.identity_blocked or a.role<>'student' or a.application_status='approved' then raise exception 'Application access denied' using errcode='42501'; end if;
  if a.application_version is distinct from expected_version then raise exception 'Application updated' using errcode='PT409'; end if;
  if error_verified is distinct from true or reason is null or char_length(btrim(reason)) not between 1 and 2000 then raise exception 'Verified error and reason required' using errcode='23514'; end if;
  if exists(select 1 from private.account_operations where account_id=a.id and purpose='identity_correction' and state not in ('complete','failed')) then raise exception 'Replacement email pending' using errcode='55000'; end if;
  if not exists(select 1 from private.student_number_claims c where c.student_number=correct_student_number.student_number and c.account_id=a.id) then raise exception 'Number not available for correction' using errcode='23514'; end if;
  if a.student_number=student_number then
    replacement_number := nullif(btrim(replacement_number),'');
    if replacement_number is null or replacement_number=student_number or char_length(replacement_number)>50 then raise exception 'Valid replacement number required' using errcode='23514'; end if;
    if exists(select 1 from private.account_reservations r where r.student_number=replacement_number and r.released_at is null and r.account_id is distinct from a.id) then raise exception 'Number requires verification' using errcode='23505'; end if;
    update public.accounts set student_number=replacement_number where id=a.id returning * into a;
  else
    update public.accounts set application_version=application_version+1 where id=a.id returning * into a;
  end if;
  update private.account_reservations r set student_number=a.student_number where r.account_id=a.id and r.student_number=correct_student_number.student_number;
  delete from private.student_number_claims c where c.student_number=correct_student_number.student_number and c.account_id=a.id;
  insert into private.account_events(actor_id,account_id,event,reason) values(actor.id,a.id,'application_number_corrected',btrim(reason));
  return private.application_projection(a,true);
end $$;
create function public.correct_student_number(target_id uuid,expected_version bigint,student_number text,replacement_number text,reason text,error_verified boolean) returns jsonb
language sql security invoker set search_path='' as $$ select private.correct_student_number(target_id,expected_version,student_number,replacement_number,reason,error_verified); $$;

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
  if target.application_version<>expected_version then raise exception 'Application updated' using errcode='PT409'; end if;
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
  if a.application_version is distinct from expected_version then raise exception 'Application updated' using errcode='PT409'; end if;
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
  if a.application_version is distinct from expected_version then raise exception 'Application updated' using errcode='PT409'; end if;
  if not private.application_email_verified(a) or exists(select 1 from private.account_operations where account_id=a.id and purpose='identity_correction' and state not in ('complete','failed')) then raise exception 'Email verification required' using errcode='55000'; end if;
  update public.accounts set application_status='pending' where id=a.id returning * into a;
  insert into private.account_events(actor_id,account_id,event,reason) values(a.id,a.id,'application_resubmitted','Applicant resubmitted the corrected application.');
  return private.application_projection(a,false);
end $$;

create or replace function private.claim_email_challenge(challenge_hash text, capability_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare p private.email_proofs; a public.accounts; r private.account_reservations; op uuid; gen bigint;
begin
  if challenge_hash !~ '^[a-f0-9]{64}$' or capability_hash !~ '^[a-f0-9]{64}$' or capability_hash is null then raise exception 'Invalid proof'; end if;
  select * into p from private.email_proofs e where e.challenge_hash=claim_email_challenge.challenge_hash;
  if p.purpose='replacement' then return private.advance_replacement_proof(p.id,capability_hash,'claim'); end if;
  select * into a from public.accounts where id=p.account_id for update;
  select * into r from private.account_reservations where id=p.reservation_id for update;
  select * into p from private.email_proofs where id=p.id for update;
  if p.id is null or a.id is null or not a.active or p.expires_at<=clock_timestamp() or p.generation<>r.proof_generation
      or r.released_at is not null or a.email<>r.email or a.role<>r.role or (p.state<>'complete' and a.application_status<>'pending') or p.state='failed'
      or (p.capability_hash is not null and p.capability_hash<>capability_hash) then raise exception 'Invalid proof'; end if;
  if p.state='pending' then
    if exists(select 1 from private.account_operations where account_id=a.id and state in ('applying','auth_applied')) then raise exception 'Operation in progress'; end if;
    if p.purpose='invitation' and p.native_type='invite' then
      update public.accounts set operation_generation=operation_generation+1 where id=a.id returning operation_generation into gen;
      insert into private.account_operations(account_id,generation,purpose,state,verified_at,expires_at,started_at)
        values(a.id,gen,'invitation_password','applying',clock_timestamp(),p.expires_at,clock_timestamp()) returning id into op;
    end if;
    update private.email_proofs set state='claimed',consumed_at=clock_timestamp(),capability_hash=claim_email_challenge.capability_hash,delivery_challenge=null,operation_id=op where id=p.id returning * into p;
    update private.mail_work set state='discarded',lease_id=null,lease_until=null where proof_id=p.id and state in ('pending','sending');
  end if;
  return jsonb_build_object('proof_id',p.id,'account_id',p.account_id,'purpose',p.purpose,'native_type',p.native_type,'recipient',r.email,'state',p.state,'operation_id',p.operation_id,'native_verifier',p.native_verifier,'expires_at',p.expires_at);
end;
$$;

create or replace function private.advance_email_operation(proof_id uuid,capability_hash text,step text,full_name text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare p private.email_proofs; a public.accounts; r private.account_reservations; o private.account_operations; gen bigint; event_id uuid;
begin
  select * into p from private.email_proofs where id=proof_id;
  if p.purpose='replacement' then return private.advance_replacement_proof(p.id,capability_hash,step); end if;
  select * into a from public.accounts where id=p.account_id for update;
  select * into r from private.account_reservations where id=p.reservation_id for update;
  select * into p from private.email_proofs where id=proof_id for update;
  select * into o from private.account_operations where id=p.operation_id for update;
  if p.id is null or p.capability_hash is distinct from capability_hash or capability_hash is null or (p.expires_at<=clock_timestamp() and not(step='finish' and o.state='auth_applied'))
    or r.released_at is not null or p.generation<>r.proof_generation or a.role<>r.role or (p.state<>'complete' and a.application_status<>'pending')
    or (o.id is not null and o.generation<>a.operation_generation) or p.state in ('pending','failed') or not a.active or a.email<>r.email then raise exception 'Invalid operation'; end if;
  select * into o from private.account_operations where id=p.operation_id for update;
  if step='redeemed' and p.state='claimed' then
    if p.purpose='invitation' then
      if p.native_type='invite' and o.state is distinct from 'auth_applied' then raise exception 'Native proof incomplete'; end if;
      update private.account_operations set state='complete' where id=o.id;
      update public.accounts set operation_generation=operation_generation+1 where id=a.id returning operation_generation into gen;
      insert into private.account_operations(account_id,generation,purpose,state,verified_at,expires_at)
        values(a.id,gen,'invitation_password','verified',clock_timestamp(),p.expires_at) returning * into o;
      update private.email_proofs set operation_id=o.id,state='verified',native_verifier=null where id=p.id returning * into p;
    else
      update private.email_proofs set state='complete',native_verifier=null where id=p.id returning * into p;
    end if;
  elsif step='apply' and p.purpose='invitation' and p.state='verified' then
    if o.state='verified' then
      if full_name is null or char_length(btrim(full_name)) not between 1 and 200 then raise exception 'Invalid name'; end if;
      update private.account_operations set state='applying',started_at=clock_timestamp(),requested_full_name=btrim(full_name) where id=o.id returning * into o;
    elsif o.state not in ('applying','auth_applied','complete') then raise exception 'Invalid operation'; end if;
  elsif step='finish' and p.purpose='invitation' and p.state='verified' then
    if o.state<>'auth_applied' or o.requested_full_name is null then raise exception 'Password not applied'; end if;
    update public.accounts set full_name=o.requested_full_name,employee_number=o.requested_employee_number,application_status='approved',revoked_before=clock_timestamp() where id=a.id;
    update private.account_operations set state='complete',requested_full_name=null where id=o.id returning * into o;
    update private.email_proofs set state='complete',native_verifier=null,delivery_challenge=null where id=p.id returning * into p;
    insert into private.account_events(actor_id,account_id,event,reason) values(r.invited_by,a.id,'invitation_accepted','Synthetic fixture invitation accepted by its verified holder') returning id into event_id;
    insert into private.mail_work(event_id,recipient,kind) values(event_id,a.email,'approved');
  elsif step<>'inspect' and p.state<>'complete' then raise exception 'Invalid operation step';
  end if;
  return jsonb_build_object('proof_id',p.id,'account_id',p.account_id,'purpose',p.purpose,'state',p.state,'operation_id',p.operation_id,'operation_state',o.state,'expires_at',p.expires_at,'recipient',a.email,'role',a.role);
end;
$$;


create or replace function private.fence_auth_credentials() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  final_user record;
  account public.accounts;
  operation private.account_operations;
  reservation private.account_reservations;
  password_changed boolean := coalesce(new.encrypted_password, '') is distinct from coalesce(old.encrypted_password, '');
  email_changed boolean := new.email is distinct from old.email;
  operation_marker text;
begin
  if not password_changed and not email_changed then return null; end if;
  if password_changed and email_changed then raise exception 'Separate credential operations required' using errcode = '23514'; end if;
  select * into final_user from private.auth_user_for_guard(new.id);
  if not found then return null; end if;
  select * into account from public.accounts where id = new.id for update;
  operation_marker := final_user.raw_app_meta_data ->> case when password_changed then 'password_operation_id' else 'identity_operation_id' end;
  select * into operation from private.account_operations where id::text = operation_marker and account_id = account.id for update;
  if not found or operation.state <> 'applying' or operation.generation <> account.operation_generation
      or operation.verified_at is null or operation.expires_at <= clock_timestamp() then
    raise exception 'Verified credential operation required' using errcode = '23514';
  end if;
  if password_changed then
    if operation.purpose not in ('password_reset','invitation_password','assisted_password')
        or not final_user.has_password then
      raise exception 'Invalid password operation' using errcode = '23514';
    end if;
  else
    select * into reservation from private.account_reservations where id = operation.reservation_id for update;
    if operation.purpose not in ('assisted_email','identity_correction') or not account.identity_blocked
        or reservation.id is null or reservation.purpose <> 'replacement' or reservation.account_id is distinct from account.id
        or reservation.role <> account.role or reservation.student_number is distinct from account.student_number
        or reservation.released_at is not null or reservation.consumed_at is not null
        or reservation.expires_at <= clock_timestamp() or lower(btrim(final_user.email)) <> reservation.email then
      raise exception 'Invalid identity operation' using errcode = '23514';
    end if;
    if operation.purpose='identity_correction' and (not account.active or account.application_status not in ('pending','needs_correction')) then raise exception 'Correction not permitted' using errcode='23514'; end if;
    update public.accounts set email = reservation.email where id = account.id;
    update private.account_reservations set consumed_at = clock_timestamp() where id = reservation.id;
    update private.account_reservations set released_at = clock_timestamp() where account_id = account.id and id <> reservation.id and released_at is null;
  end if;
  update public.accounts set revoked_before = clock_timestamp() where id = account.id;
  update private.account_operations set state = 'auth_applied' where id = operation.id;
  return null;
end;
$$;


create or replace function private.reconcile_auth_mail() returns void
language plpgsql security definer set search_path = '' as $$
declare candidate record; p private.email_proofs; a public.accounts; o private.account_operations; r private.account_reservations;
begin
  for candidate in select id,account_id,reservation_id from private.email_proofs where state not in ('complete','failed') order by account_id limit 100 loop
    select * into a from public.accounts where id=candidate.account_id for update;
    select * into r from private.account_reservations where id=candidate.reservation_id for update;
    select * into p from private.email_proofs where id=candidate.id for update;
    if p.state in ('complete','failed') then continue; end if;
    select * into o from private.account_operations where id=p.operation_id for update;
    if p.purpose='replacement' then
      if o.state='auth_applied' then
        perform private.advance_replacement_proof(p.id,p.capability_hash,'finish');
      elsif p.expires_at<=clock_timestamp() or (o.state='applying' and o.started_at<=clock_timestamp()-interval '2 minutes')
          or not a.active or a.application_status not in ('pending','needs_correction') or r.released_at is not null or o.generation<>a.operation_generation then
        update private.account_operations set state='failed' where id=o.id;
        update private.email_proofs set state='failed',delivery_challenge=null,capability_hash=null where id=p.id;
        update private.account_reservations set released_at=clock_timestamp() where id=r.id;
        update public.accounts set identity_blocked=false,application_version=application_version+1 where id=a.id and operation_generation=o.generation;
      end if;
      continue;
    end if;
    if r.released_at is not null or p.generation<>r.proof_generation or not a.active or a.application_status<>'pending'
      or a.role<>r.role or a.email<>r.email or (o.id is not null and o.generation<>a.operation_generation) then
      update private.account_operations set state='failed',requested_full_name=null,requested_employee_number=null where id=o.id and state<>'complete';
      update private.email_proofs set state='failed',native_verifier=null,delivery_challenge=null,capability_hash=null where id=p.id;
    elsif o.state='auth_applied' and p.state='verified' and o.requested_full_name is not null then
      perform private.advance_email_operation(p.id,p.capability_hash,'finish');
    elsif o.state='auth_applied' and p.state='claimed' and p.expires_at>clock_timestamp() then
      perform private.advance_email_operation(p.id,p.capability_hash,'redeemed');
    elsif p.expires_at<=clock_timestamp() or (o.state='applying' and o.started_at<=clock_timestamp()-interval '2 minutes') then
      update private.account_operations set state=case when state='auth_applied' then 'complete' else 'failed' end,requested_full_name=null,requested_employee_number=null
        where id=o.id and state in ('pending','verified','applying','auth_applied');
      update private.email_proofs set state='failed',native_verifier=null,delivery_challenge=null,capability_hash=null where id=p.id;
    end if;
  end loop;
  update private.email_proofs set native_verifier=null,delivery_challenge=null,capability_hash=null where expires_at<=clock_timestamp();
  update private.mail_work set state='discarded',lease_id=null,lease_until=null where state in ('pending','sending') and proof_id in
    (select id from private.email_proofs where state<>'pending' or expires_at<=clock_timestamp());
end;
$$;

create or replace function private.application_projection(a public.accounts,delivery boolean) returns jsonb
language sql stable set search_path='' as $$
  select jsonb_build_object('id',a.id,'role',a.role,'full_name',a.full_name,'student_number',a.student_number,
    'employee_number',a.employee_number,'email',a.email,'status',a.application_status,'version',a.application_version,
    'applied_at',a.applied_at,'email_verified',private.application_email_verified(a),
    'replacement',(select jsonb_build_object('email',r.email,'expires_at',p.expires_at) from private.account_operations o join private.account_reservations r on r.id=o.reservation_id join private.email_proofs p on p.operation_id=o.id where o.account_id=a.id and o.purpose='identity_correction' and o.state not in ('complete','failed') order by o.generation desc limit 1),
    'history',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'event',e.event,'reason',e.reason,'created_at',e.created_at) order by e.created_at desc)
      from private.account_events e where e.account_id=a.id and e.event like 'application_%'),'[]'::jsonb))
    || case when delivery then jsonb_build_object('retained_numbers',coalesce((select jsonb_agg(student_number order by student_number) from private.student_number_claims where account_id=a.id),'[]'::jsonb),'delivery_state',(select m.state from private.mail_work m join private.account_events e on e.id=m.event_id
        where e.account_id=a.id and e.event like 'application_%' order by e.created_at desc limit 1)) else '{}'::jsonb end;
$$;


create or replace function private.prepare_mail_work(work_id uuid,claim_id uuid) returns boolean
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
    or r.released_at is not null or not a.active or a.role<>r.role or m.recipient<>r.email
    or (p.purpose<>'replacement' and (a.application_status<>'pending' or a.email<>r.email))
    or (p.purpose='replacement' and a.application_status not in ('pending','needs_correction'))) then
    update private.mail_work set state='discarded',lease_id=null,lease_until=null where id=m.id;
    return false;
  end if;
  update private.mail_work set lease_until=clock_timestamp()+interval '2 minutes' where id=m.id;
  return true;
end;
$$;

create or replace function private.claim_mail_work(batch_size integer default 10) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.reconcile_auth_mail();
  with due as (
    select id from private.mail_work where (state='pending' and due_at<=clock_timestamp()) or (state='sending' and lease_until<=clock_timestamp())
    order by due_at for update skip locked limit least(greatest(batch_size,1),20)
  ), claimed as (
    update private.mail_work m set state='sending',lease_id=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes',attempts=attempts+1
    from due where m.id=due.id returning m.*
  ) select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'lease_id',c.lease_id,'recipient',c.recipient,'kind',c.kind,'challenge',p.delivery_challenge,'expires_at',p.expires_at,'reason',e.reason)),'[]') into result
    from claimed c left join private.email_proofs p on p.id=c.proof_id left join private.account_events e on e.id=c.event_id;
  return result;
end;
$$;
do $$ declare f record; begin
  for f in select p.oid::regprocedure signature,n.nspname,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('private','public') and p.proname in ('request_application_email','cancel_application_email','advance_replacement_proof','correct_student_number') loop
    if f.nspname='private' then execute format('alter function %s owner to account_guard_owner',f.signature); end if;
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
    if f.proname<>'advance_replacement_proof' then execute format('grant execute on function %s to authenticated',f.signature); end if;
  end loop;
end $$;
revoke create on schema private from account_guard_owner;
