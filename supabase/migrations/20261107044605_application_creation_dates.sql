-- Account creation is atomic with Auth creation; preserve that date for preexisting applications.
update public.accounts a set applied_at=u.created_at from auth.users u where u.id=a.id;
do $$ begin
  if exists(select 1 from public.accounts a join auth.users u on u.id=a.id where a.applied_at is distinct from u.created_at) then
    raise exception 'Existing application creation dates were not preserved';
  end if;
end $$;
