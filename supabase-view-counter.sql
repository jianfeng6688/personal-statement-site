create or replace function public.increment_site_view_count(row_id text default 'default')
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  next_count integer;
begin
  select
    case
      when content ? 'viewCount' and (content ->> 'viewCount') ~ '^[0-9]+$'
        then (content ->> 'viewCount')::integer
      else 3826
    end
  into current_count
  from public.site_content
  where id = row_id
  for update;

  if current_count is null then
    return 3826;
  end if;

  next_count := current_count + 1;

  update public.site_content
  set
    content = jsonb_set(content, '{viewCount}', to_jsonb(next_count), true),
    updated_at = now()
  where id = row_id;

  return next_count;
end;
$$;

grant execute on function public.increment_site_view_count(text) to anon, authenticated;
