-- Run only on the isolated TEST project. The transaction rolls back every synthetic event.
begin;
do $$
declare email text := 'boundary-' || gen_random_uuid()::text || '@example.invalid'; ip inet := '2001:db8:ffff:eeee::1'; attempt uuid;
begin
 if not exists(select 1 from private.environment where mode='test' and project_ref='ggiccvcrkydcimveyrfi') then raise exception 'Isolated TEST required'; end if;
 perform pg_advisory_xact_lock(76420614001);
 delete from private.authentication_limits where source_ip=ip;
 for i in 1..10 loop
   attempt := private.admit_authentication(ip,email);
   if attempt is null then raise exception 'Ten attempts must fit'; end if;
 end loop;
 if private.admit_authentication(ip,upper(email)) is not null then raise exception 'Eleventh identifier attempt accepted'; end if;
 update private.authentication_limits set created_at=clock_timestamp()-interval '14 minutes 59 seconds' where source_ip=ip;
 if private.admit_authentication(ip,email) is not null then raise exception 'Early expiry'; end if;
 update private.authentication_limits set created_at=clock_timestamp()-interval '15 minutes' where source_ip=ip;
 if private.admit_authentication(ip,email) is null then raise exception 'Expiry boundary did not reopen'; end if;
end $$;
rollback;
