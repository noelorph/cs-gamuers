create or replace function public.send_auth_email(event jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
  if coalesce(event->'email_data'->>'email_action_type','') not in ('signup','invite') then raise exception 'Unsupported email proof' using errcode='23514'; end if;
  perform private.issue_auth_email((event->'user'->>'id')::uuid,event->'user'->>'email',event->'email_data'->>'email_action_type',event->'email_data'->>'token_hash');
  return '{}'::jsonb;
end;
$$;
