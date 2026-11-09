grant create on schema private to account_guard_owner;
-- Admission precedes Auth: unfinished attempts conservatively remain failures.
create table private.authentication_limits (
  id uuid primary key default gen_random_uuid(),
  source_ip inet not null,
  identifier_hash bytea,
  created_at timestamptz not null default clock_timestamp(),
  failed boolean not null default true
);
alter table private.authentication_limits enable row level security;
alter table private.authentication_limits owner to account_guard_owner;
revoke all on private.authentication_limits from public, anon, authenticated, service_role;
create index authentication_limits_source_idx on private.authentication_limits(source_ip,created_at);
create index authentication_limits_identifier_idx on private.authentication_limits(identifier_hash,created_at) where failed;

create function private.admit_authentication(source_ip inet, identifier text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare admitted_at timestamptz; attempt uuid; identifier_digest bytea;
begin
  if source_ip is null or (identifier is not null and octet_length(identifier)>254) then raise exception 'Invalid admission'; end if;
  -- Seven-user local workload: one short admission lock gives exact cross-bucket ordering.
  perform pg_advisory_xact_lock(76420614001);
  admitted_at := clock_timestamp();
  delete from private.authentication_limits where created_at <= admitted_at - interval '15 minutes';
  identifier_digest := sha256(convert_to(lower(btrim(identifier)),'UTF8'));
  if (select count(*) from private.authentication_limits a where a.source_ip=admit_authentication.source_ip)>=100 then return null; end if;
  -- Rejected identifier submissions still consume the shared source quota.
  insert into private.authentication_limits(source_ip,identifier_hash,created_at,failed)
    values(source_ip,null,admitted_at,false) returning id into attempt;
  if identifier_digest is not null and (select count(*) from private.authentication_limits a where a.identifier_hash=identifier_digest and a.failed)>=10 then return null; end if;
  update private.authentication_limits set identifier_hash=identifier_digest,failed=identifier_digest is not null where id=attempt;
  return attempt;
end $$;
alter function private.admit_authentication(inet,text) owner to account_guard_owner;
revoke all on function private.admit_authentication(inet,text) from public,anon,authenticated;
grant execute on function private.admit_authentication(inet,text) to service_role;
create function public.admit_authentication(source_ip inet,identifier text default null) returns uuid
language sql security invoker set search_path = '' as $$ select private.admit_authentication(source_ip,identifier); $$;
revoke all on function public.admit_authentication(inet,text) from public,anon,authenticated;
grant execute on function public.admit_authentication(inet,text) to service_role;

create function private.finish_authentication(attempt_id uuid,succeeded boolean) returns void
language sql security definer set search_path = '' as $$
  update private.authentication_limits set failed=false where id=attempt_id and succeeded;
$$;
alter function private.finish_authentication(uuid,boolean) owner to account_guard_owner;
revoke all on function private.finish_authentication(uuid,boolean) from public,anon,authenticated;
grant execute on function private.finish_authentication(uuid,boolean) to service_role;
create function public.finish_authentication(attempt_id uuid,succeeded boolean) returns void
language sql security invoker set search_path = '' as $$ select private.finish_authentication(attempt_id,succeeded); $$;
revoke all on function public.finish_authentication(uuid,boolean) from public,anon,authenticated;
grant execute on function public.finish_authentication(uuid,boolean) to service_role;

-- Deactivated password holders may see only this safe status, never application records.
create function private.account_status() returns table(application_status public.application_status,active boolean)
language sql stable security definer set search_path = '' as $$
  select a.application_status,a.active from public.accounts a
    where a.id=auth.uid() and not a.identity_blocked and private.auth_session_is_live(a.id,a.revoked_before);
$$;
alter function private.account_status() owner to account_guard_owner;
revoke all on function private.account_status() from public,anon,service_role;
grant execute on function private.account_status() to authenticated;
create function public.account_status() returns table(application_status public.application_status,active boolean)
language sql stable security invoker set search_path = '' as $$ select * from private.account_status(); $$;
revoke all on function public.account_status() from public,anon,service_role;
grant execute on function public.account_status() to authenticated;

revoke create on schema private from account_guard_owner;
