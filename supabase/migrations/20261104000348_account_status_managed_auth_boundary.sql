-- The existing read-only bridge validates auth.uid itself; its caller cannot access managed Auth.
create or replace function private.account_status() returns table(application_status public.application_status,active boolean)
language sql stable security definer set search_path = '' as $$
  select a.application_status,a.active from public.accounts a
    where not a.identity_blocked and private.auth_session_is_live(a.id,a.revoked_before);
$$;
