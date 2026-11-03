grant create on schema private to account_guard_owner;
alter table private.account_reservations add column proof_generation bigint not null default 0;
alter table private.account_operations add column started_at timestamptz;
alter table private.account_operations add column requested_full_name text check (char_length(btrim(requested_full_name)) between 1 and 200);

create table private.email_proofs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references private.account_reservations(id) on delete cascade,
  account_id uuid not null,
  generation bigint not null,
  purpose text not null check (purpose in ('verification','invitation')),
  challenge_hash text not null unique,
  capability_hash text,
  native_verifier text,
  delivery_challenge text,
  operation_id uuid,
  state text not null default 'pending' check (state in ('pending','claimed','verified','complete','failed')),
  created_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  unique(reservation_id,generation)
);
create index email_proofs_account_idx on private.email_proofs(account_id);
create index email_proofs_expiry_idx on private.email_proofs(expires_at) where state not in ('complete','failed');
create table private.account_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  account_id uuid not null,
  event text not null,
  reason text not null check (char_length(btrim(reason)) between 1 and 2000),
  created_at timestamptz not null default clock_timestamp(),
  unique(account_id,event)
);
create index account_events_actor_idx on private.account_events(actor_id);
create table private.mail_work (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid unique references private.email_proofs(id) on delete cascade,
  event_id uuid unique references private.account_events(id) on delete cascade,
  recipient text not null,
  kind text not null check (kind in ('verification','invitation','approved')),
  state text not null default 'pending' check (state in ('pending','sending','sent','failed','discarded')),
  attempts integer not null default 0,
  due_at timestamptz not null default clock_timestamp(),
  lease_id uuid,
  lease_until timestamptz,
  check ((proof_id is null) <> (event_id is null))
);
create index mail_work_due_idx on private.mail_work(due_at) where state in ('pending','sending');
alter table private.email_proofs enable row level security;
alter table private.account_events enable row level security;
alter table private.mail_work enable row level security;
alter table private.email_proofs owner to account_guard_owner;
alter table private.account_events owner to account_guard_owner;
alter table private.mail_work owner to account_guard_owner;
revoke all on private.email_proofs,private.account_events,private.mail_work from public,anon,authenticated,service_role;
grant usage on schema extensions to account_guard_owner;
grant execute on function extensions.gen_random_bytes(integer),extensions.digest(text,text) to account_guard_owner;

create function private.issue_auth_email(target_id uuid, recipient text, native_type text, native_verifier text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare a public.accounts; r private.account_reservations; issued timestamptz := clock_timestamp(); challenge text; proof_id uuid; purpose text;
begin
  if native_type not in ('signup','invite') or native_type is null or native_verifier is null or length(native_verifier) not between 16 and 256 then
    raise exception 'Unsupported email proof' using errcode='23514';
  end if;
  purpose := case native_type when 'signup' then 'verification' else 'invitation' end;
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
  if exists(select 1 from private.email_proofs p where p.reservation_id=r.id and p.purpose=issue_auth_email.purpose and p.created_at>issued-interval '60 seconds')
      or (select count(*) from private.email_proofs p where p.reservation_id=r.id and p.purpose=issue_auth_email.purpose and p.created_at>issued-interval '1 hour')>=5 then
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
    values(r.id,target_id,r.proof_generation,purpose,encode(extensions.digest(challenge,'sha256'),'hex'),native_verifier,challenge,issued,issued+interval '1800 seconds') returning id into proof_id;
  insert into private.mail_work(proof_id,recipient,kind) values(proof_id,r.email,purpose);
  return '{"queued":true}'::jsonb;
end;
$$;

create function public.send_auth_email(event jsonb) returns jsonb
language sql security invoker set search_path = '' as $$
  select private.issue_auth_email((event->'user'->>'id')::uuid,event->'user'->>'email',event->'email_data'->>'email_action_type',event->'email_data'->>'token_hash');
$$;
create function public.queue_generated_auth_email(target_id uuid,recipient text,native_type text,native_verifier text) returns jsonb
language sql security invoker set search_path = '' as $$
  select private.issue_auth_email(target_id,recipient,native_type,native_verifier);
$$;

create function private.claim_email_challenge(challenge_hash text, capability_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare p private.email_proofs; a public.accounts; r private.account_reservations; op uuid; gen bigint;
begin
  if challenge_hash !~ '^[a-f0-9]{64}$' or capability_hash !~ '^[a-f0-9]{64}$' or capability_hash is null then raise exception 'Invalid proof'; end if;
  select * into p from private.email_proofs e where e.challenge_hash=claim_email_challenge.challenge_hash;
  select * into a from public.accounts where id=p.account_id for update;
  select * into r from private.account_reservations where id=p.reservation_id for update;
  select * into p from private.email_proofs where id=p.id for update;
  if p.id is null or a.id is null or not a.active or p.expires_at<=clock_timestamp() or p.generation<>r.proof_generation
      or r.released_at is not null or a.email<>r.email or p.state='failed'
      or (p.capability_hash is not null and p.capability_hash<>capability_hash) then raise exception 'Invalid proof'; end if;
  if p.state='pending' then
    if exists(select 1 from private.account_operations where account_id=a.id and state in ('applying','auth_applied')) then raise exception 'Operation in progress'; end if;
    if p.purpose='invitation' then
      update public.accounts set operation_generation=operation_generation+1 where id=a.id returning operation_generation into gen;
      insert into private.account_operations(account_id,generation,purpose,state,verified_at,expires_at,started_at)
        values(a.id,gen,'invitation_password','applying',clock_timestamp(),p.expires_at,clock_timestamp()) returning id into op;
    end if;
    update private.email_proofs set state='claimed',consumed_at=clock_timestamp(),capability_hash=claim_email_challenge.capability_hash,delivery_challenge=null,operation_id=op where id=p.id returning * into p;
    update private.mail_work set state='discarded',lease_id=null,lease_until=null where proof_id=p.id and state in ('pending','sending');
  end if;
  return jsonb_build_object('proof_id',p.id,'account_id',p.account_id,'purpose',p.purpose,'state',p.state,'operation_id',p.operation_id,'native_verifier',p.native_verifier,'expires_at',p.expires_at);
end;
$$;
create function public.claim_email_challenge(challenge_hash text,capability_hash text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.claim_email_challenge(challenge_hash,capability_hash); $$;

create function private.advance_email_operation(proof_id uuid,capability_hash text,step text,full_name text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare p private.email_proofs; a public.accounts; r private.account_reservations; o private.account_operations; gen bigint; event_id uuid;
begin
  select * into p from private.email_proofs where id=proof_id;
  select * into a from public.accounts where id=p.account_id for update;
  select * into r from private.account_reservations where id=p.reservation_id for update;
  select * into p from private.email_proofs where id=proof_id for update;
  if p.id is null or p.capability_hash is distinct from capability_hash or capability_hash is null or p.expires_at<=clock_timestamp()
    or p.generation<>r.proof_generation or p.state in ('pending','failed') or not a.active or a.email<>r.email then raise exception 'Invalid operation'; end if;
  select * into o from private.account_operations where id=p.operation_id for update;
  if step='redeemed' and p.state='claimed' then
    if p.purpose='invitation' then
      if o.state<>'auth_applied' then raise exception 'Native proof incomplete'; end if;
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
    update public.accounts set full_name=o.requested_full_name,application_status='approved',revoked_before=clock_timestamp() where id=a.id;
    update private.account_operations set state='complete',requested_full_name=null where id=o.id returning * into o;
    update private.email_proofs set state='complete',native_verifier=null,delivery_challenge=null where id=p.id returning * into p;
    insert into private.account_events(actor_id,account_id,event,reason) values(null,a.id,'invitation_accepted','Synthetic fixture invitation accepted by its verified holder') returning id into event_id;
    insert into private.mail_work(event_id,recipient,kind) values(event_id,a.email,'approved');
  elsif step<>'inspect' and p.state<>'complete' then raise exception 'Invalid operation step';
  end if;
  return jsonb_build_object('proof_id',p.id,'account_id',p.account_id,'purpose',p.purpose,'state',p.state,'operation_id',p.operation_id,'operation_state',o.state,'expires_at',p.expires_at);
end;
$$;
create function public.advance_email_operation(proof_id uuid,capability_hash text,step text,full_name text default null) returns jsonb
language sql security invoker set search_path = '' as $$ select private.advance_email_operation(proof_id,capability_hash,step,full_name); $$;

create function private.reconcile_auth_mail() returns void
language plpgsql security definer set search_path = '' as $$
declare p private.email_proofs; a public.accounts; o private.account_operations;
begin
  for p in select * from private.email_proofs where state not in ('complete','failed') order by account_id limit 100 loop
    select * into a from public.accounts where id=p.account_id for update;
    select * into o from private.account_operations where id=p.operation_id for update;
    if p.expires_at<=clock_timestamp() or (o.state='applying' and o.started_at<=clock_timestamp()-interval '2 minutes') then
      update private.account_operations set state='failed',requested_full_name=null where id=o.id and state in ('pending','verified','applying');
      update private.email_proofs set state='failed',native_verifier=null,delivery_challenge=null,capability_hash=null where id=p.id;
    end if;
  end loop;
  update private.email_proofs set native_verifier=null,delivery_challenge=null,capability_hash=null where expires_at<=clock_timestamp();
  update private.mail_work set state='discarded',lease_id=null,lease_until=null where state in ('pending','sending') and proof_id in
    (select id from private.email_proofs where state<>'pending' or expires_at<=clock_timestamp());
end;
$$;
create function public.reconcile_auth_mail() returns void
language sql security invoker set search_path = '' as $$ select private.reconcile_auth_mail(); $$;

create function private.claim_mail_work(batch_size integer default 10) returns jsonb
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
  ) select coalesce(jsonb_agg(jsonb_build_object('id',c.id,'lease_id',c.lease_id,'recipient',c.recipient,'kind',c.kind,'challenge',p.delivery_challenge,'expires_at',p.expires_at)),'[]') into result
    from claimed c left join private.email_proofs p on p.id=c.proof_id;
  return result;
end;
$$;
create function public.claim_mail_work(batch_size integer default 10) returns jsonb
language sql security invoker set search_path = '' as $$ select private.claim_mail_work(batch_size); $$;
create function private.finish_mail_work(work_id uuid,claim_id uuid,delivered boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update private.mail_work set state=case when delivered then 'sent' when attempts>=5 then 'failed' else 'pending' end,
    due_at=clock_timestamp()+make_interval(mins=>case attempts when 1 then 1 when 2 then 5 when 3 then 15 else 60 end),lease_id=null,lease_until=null
    where id=work_id and lease_id=claim_id and state='sending';
end;
$$;
create function public.finish_mail_work(work_id uuid,claim_id uuid,delivered boolean) returns void
language sql security invoker set search_path = '' as $$ select private.finish_mail_work(work_id,claim_id,delivered); $$;

-- App clients cannot call hook or operation internals. Only the native hook role queues Auth requests.
grant usage on schema private to supabase_auth_admin,service_role;
revoke all on function public.send_auth_email(jsonb) from public,anon,authenticated,service_role;
grant execute on function public.send_auth_email(jsonb) to supabase_auth_admin;
revoke all on function private.issue_auth_email(uuid,text,text,text) from public,anon,authenticated;
grant execute on function private.issue_auth_email(uuid,text,text,text) to supabase_auth_admin,service_role;

alter table private.account_reservations add column invited_by uuid;
create table private.demo_setup (
  singleton boolean primary key default true check(singleton),
  manifest_hash text not null check(manifest_hash ~ '^[a-f0-9]{64}$'),
  bootstrap_id uuid not null references private.account_reservations(id)
);
create table private.demo_slots (
  slot text primary key check(slot in ('administrator','program_head','student_1','student_2','student_3','faculty_1','faculty_2')),
  reservation_id uuid not null unique references private.account_reservations(id)
);
alter table private.demo_setup enable row level security;
alter table private.demo_slots enable row level security;
alter table private.demo_setup owner to account_guard_owner;
alter table private.demo_slots owner to account_guard_owner;
revoke all on private.demo_setup,private.demo_slots from public,anon,authenticated,service_role;

create function private.require_demo_project(project_ref text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists(select 1 from private.environment e where e.project_ref=require_demo_project.project_ref and mode in ('demo','test')) then
    raise exception 'Protected demonstration project required' using errcode='42501';
  end if;
end;
$$;
create function private.bootstrap_demo_administrator(project_ref text,manifest_hash text,email text,full_name text) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare r private.account_reservations; setup private.demo_setup;
begin
  perform private.require_demo_project(project_ref);
  perform pg_advisory_xact_lock(18473,1);
  select * into setup from private.demo_setup where singleton for update;
  if setup.singleton then
    select * into r from private.account_reservations where id=setup.bootstrap_id for update;
    if setup.manifest_hash<>manifest_hash or r.email<>lower(btrim(email)) or r.full_name<>btrim(full_name) then raise exception 'Original manifest required'; end if;
  else
    if exists(select 1 from public.accounts where role='administrator') or exists(select 1 from private.account_reservations where role='administrator' and released_at is null) then raise exception 'Administrator already reserved'; end if;
    insert into private.account_reservations(email,full_name,role,purpose,synthetic,expires_at)
      values(lower(btrim(email)),btrim(full_name),'administrator','invitation',true,clock_timestamp()+interval '30 minutes') returning * into r;
    insert into private.demo_setup(manifest_hash,bootstrap_id) values(manifest_hash,r.id);
    insert into private.demo_slots values('administrator',r.id);
  end if;
  if r.account_id is null then update private.account_reservations set expires_at=clock_timestamp()+interval '30 minutes' where id=r.id; end if;
  return jsonb_build_object('reservation_id',r.id,'account_id',r.account_id,'role',r.role,'email',r.email,'full_name',r.full_name);
end;
$$;
create function public.bootstrap_demo_administrator(project_ref text,manifest_hash text,email text,full_name text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.bootstrap_demo_administrator(project_ref,manifest_hash,email,full_name); $$;

create function private.reserve_demo_slot(project_ref text,manifest_hash text,slot text,email text,full_name text,student_number text,employee_number text) returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_variable
declare actor public.accounts; r private.account_reservations; desired public.account_role;
begin
  perform private.require_demo_project(project_ref);
  select a.* into actor from public.accounts a where id=(select id from private.session_actor()) for update;
  if actor.role is distinct from 'administrator' or actor.application_status is distinct from 'approved' or not exists(select 1 from private.session_actor() a where a.id=actor.id) then raise exception 'Approved Administrator required' using errcode='42501'; end if;
  perform pg_advisory_xact_lock(18473,1);
  if not exists(select 1 from private.demo_setup d where d.manifest_hash=reserve_demo_slot.manifest_hash) then raise exception 'Original manifest required'; end if;
  desired := case when slot in ('student_1','student_2','student_3') then 'student'::public.account_role when slot in ('faculty_1','faculty_2') then 'faculty'::public.account_role when slot='program_head' then 'program_head'::public.account_role else null end;
  if desired is null then raise exception 'Invalid fixture slot'; end if;
  select ar.* into r from private.account_reservations ar join private.demo_slots ds on ds.reservation_id=ar.id where ds.slot=reserve_demo_slot.slot for update of ar;
  if r.id is not null then
    if r.email<>lower(btrim(email)) or r.full_name<>btrim(full_name) or r.student_number is distinct from student_number or r.employee_number is distinct from employee_number then raise exception 'Reserved identity mismatch'; end if;
  else
    insert into private.account_reservations(email,full_name,student_number,employee_number,role,purpose,synthetic,expires_at,invited_by)
      values(lower(btrim(email)),btrim(full_name),student_number,employee_number,desired,case when desired='program_head' then 'invitation' else 'registration' end,true,clock_timestamp()+interval '30 minutes',actor.id) returning * into r;
    insert into private.demo_slots values(slot,r.id);
    if desired='program_head' then
      insert into private.account_events(actor_id,account_id,event,reason) values(actor.id,r.id,'invitation_reserved','Synthetic fixture Program Head invitation');
    end if;
  end if;
  if r.account_id is null then update private.account_reservations set expires_at=clock_timestamp()+interval '30 minutes' where id=r.id; end if;
  return jsonb_build_object('reservation_id',r.id,'account_id',r.account_id,'role',r.role,'email',r.email,'full_name',r.full_name,'student_number',r.student_number,'employee_number',r.employee_number);
end;
$$;
create function public.reserve_demo_application(project_ref text,manifest_hash text,slot text,email text,full_name text,student_number text default null,employee_number text default null) returns jsonb
language plpgsql security invoker set search_path = '' as $$
begin
  if slot not in ('student_1','student_2','student_3','faculty_1','faculty_2') then raise exception 'Application slot required'; end if;
  return private.reserve_demo_slot(project_ref,manifest_hash,slot,email,full_name,student_number,employee_number);
end;
$$;
create function public.reserve_staff_invitation(project_ref text,manifest_hash text,email text,full_name text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.reserve_demo_slot(project_ref,manifest_hash,'program_head',email,full_name,null,null); $$;

create function private.approve_demo_application(project_ref text,target_id uuid,reason text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; target public.accounts; event_id uuid;
begin
  perform private.require_demo_project(project_ref);
  select a.* into actor from public.accounts a where id=(select id from private.session_actor()) for update;
  if actor.role is distinct from 'administrator' or actor.application_status is distinct from 'approved' or actor.id=target_id or not exists(select 1 from private.session_actor() a where a.id=actor.id) then raise exception 'Approved Administrator required' using errcode='42501'; end if;
  select * into target from public.accounts where id=target_id for update;
  if target.id is null or not target.synthetic or not target.active or target.role not in ('student','faculty')
    or not exists(select 1 from private.demo_slots s join private.account_reservations r on r.id=s.reservation_id where r.account_id=target_id)
    or not exists(select 1 from private.email_proofs where account_id=target_id and purpose='verification' and state='complete') then raise exception 'Verified fixture application required'; end if;
  if target.application_status='approved' then return '{"approved":true}'::jsonb; end if;
  if target.application_status<>'pending' or reason is null or char_length(btrim(reason)) not between 1 and 2000 then raise exception 'Pending application and reason required'; end if;
  update public.accounts set application_status='approved' where id=target_id;
  insert into private.account_events(actor_id,account_id,event,reason) values(actor.id,target_id,'application_approved','Synthetic fixture decision: '||reason) returning id into event_id;
  insert into private.mail_work(event_id,recipient,kind) values(event_id,target.email,'approved');
  return '{"approved":true}'::jsonb;
end;
$$;
create function public.approve_demo_application(project_ref text,target_id uuid,reason text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.approve_demo_application(project_ref,target_id,reason); $$;

create function private.demo_setup_status(project_ref text,manifest_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  perform private.require_demo_project(project_ref);
  if exists(select 1 from private.demo_setup d where d.manifest_hash<>demo_setup_status.manifest_hash) then raise exception 'Original manifest required'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('slot',s.slot,'reservation_id',r.id,'account_id',r.account_id,'status',a.application_status,
    'proof_complete',exists(select 1 from private.email_proofs p where p.account_id=a.id and p.state='complete'),
    'mail_state',(select m.state from private.mail_work m join private.email_proofs p on p.id=m.proof_id where p.reservation_id=r.id order by p.created_at desc limit 1))),'[]') into result
    from private.demo_slots s join private.account_reservations r on r.id=s.reservation_id left join public.accounts a on a.id=r.account_id;
  return result;
end;
$$;
create function public.demo_setup_status(project_ref text,manifest_hash text) returns jsonb
language sql security invoker set search_path = '' as $$ select private.demo_setup_status(project_ref,manifest_hash); $$;

-- A finite list keeps new privileged functions from inheriting default public execution.
grant create on schema private to account_guard_owner;
do $$
declare f record;
begin
  for f in select p.oid::regprocedure signature,p.proname,n.nspname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname in ('private','public') and p.proname in ('issue_auth_email','claim_email_challenge','advance_email_operation','reconcile_auth_mail','claim_mail_work','finish_mail_work','require_demo_project','bootstrap_demo_administrator','reserve_demo_slot','reserve_demo_application','reserve_staff_invitation','approve_demo_application','demo_setup_status','queue_generated_auth_email') loop
    execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
    if f.nspname='private' then execute format('alter function %s owner to account_guard_owner',f.signature); end if;
    if f.proname in ('reserve_demo_slot','reserve_demo_application','reserve_staff_invitation','approve_demo_application') then
      execute format('grant execute on function %s to authenticated',f.signature);
    elsif f.proname<>'require_demo_project' then
      execute format('grant execute on function %s to service_role',f.signature);
    end if;
  end loop;
end;
$$;
revoke create on schema private from account_guard_owner;
grant execute on function private.issue_auth_email(uuid,text,text,text) to supabase_auth_admin;
