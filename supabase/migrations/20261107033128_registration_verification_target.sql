-- Resolve native confirmation through the supported server-only Auth API.
create or replace function private.request_registration_verification(email text) returns text
language plpgsql security definer set search_path='' as $$
declare requested_at timestamptz; digest bytea; target_id uuid;
begin
  email := lower(btrim(email));
  if email is null or length(email)>254 or email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Invalid email' using errcode='23514';
  end if;
  perform pg_advisory_xact_lock(76420614003);
  requested_at := clock_timestamp();
  digest := sha256(convert_to(email,'UTF8'));
  delete from private.verification_requests where created_at<=requested_at-interval '1 hour';
  if exists(select 1 from private.verification_requests v where v.email_hash=digest and v.created_at>requested_at-interval '60 seconds')
      or (select count(*) from private.verification_requests v where v.email_hash=digest)>=5 then return 'throttled'; end if;
  insert into private.verification_requests(email_hash,created_at) values(digest,requested_at);
  select a.id into target_id from public.accounts a join private.account_reservations r on r.account_id=a.id
      where a.email=request_registration_verification.email and a.active and not a.identity_blocked
        and a.application_status='pending' and a.role in ('student','faculty')
        and r.email=a.email and r.purpose='registration' and r.released_at is null;
  if target_id is not null then return target_id::text; end if;
  return 'acknowledge';
end $$;
