-- The 1 MiB limit belongs to serialized application ingress, not PostgreSQL JSONB formatting.
create or replace function private.draft_details_valid(details jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(details) is distinct from 'object'
    or jsonb_typeof(details->'title') is distinct from 'string' or char_length(details->>'title')>200
    or jsonb_typeof(details->'description') is distinct from 'string' or char_length(details->>'description')>2000
    or jsonb_typeof(details->'priorKnowledge') is distinct from 'string' or char_length(details->>'priorKnowledge')>2000
    or jsonb_typeof(details->'outcomes') is distinct from 'array'
    or not details ?& array['primaryTopic','difficulty','estimatedHours'] then return false; end if;
  if exists(select 1 from jsonb_array_elements(details->'outcomes') o where jsonb_typeof(o)<>'string' or char_length(o#>>'{}')>500) then return false; end if;
  if details->'primaryTopic'<>'null'::jsonb and (jsonb_typeof(details->'primaryTopic')<>'string' or details->>'primaryTopic' not in ('Programming fundamentals','Data structures and algorithms','Web development','Mobile development','Databases','Computer systems and networking','Software engineering','Cybersecurity','Data science','Artificial intelligence and machine learning')) then return false; end if;
  if details->'difficulty'<>'null'::jsonb and (jsonb_typeof(details->'difficulty')<>'string' or details->>'difficulty' not in ('Beginner','Intermediate','Advanced')) then return false; end if;
  if details->'estimatedHours'<>'null'::jsonb and (jsonb_typeof(details->'estimatedHours')<>'number' or (details->>'estimatedHours')::double precision<=0 or (details->>'estimatedHours')::double precision>='Infinity'::double precision) then return false; end if;
  return true;
exception when numeric_value_out_of_range or invalid_text_representation then return false;
end;
$$;
