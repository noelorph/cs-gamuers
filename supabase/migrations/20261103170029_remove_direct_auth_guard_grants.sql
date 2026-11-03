-- The managed Auth bridges are the sole read boundary; remove exploratory direct grants.
revoke select (id,email,email_confirmed_at,is_anonymous,is_sso_user,phone,invited_at,encrypted_password,raw_app_meta_data,raw_user_meta_data) on auth.users from account_guard_owner;
revoke select (id,user_id,created_at,not_after) on auth.sessions from account_guard_owner;
revoke execute on function auth.uid(),auth.jwt() from account_guard_owner;
