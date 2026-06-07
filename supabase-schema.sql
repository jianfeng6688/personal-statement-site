create table if not exists public.site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.site_content enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content
for select
to anon
using (true);

-- For the simplest editable static-site setup, enable this policy.
-- Important: anyone who can inspect your public site can also find the anon key.
-- For a serious public statement site, prefer editing content inside Supabase
-- or add authenticated admin login before enabling public writes.
drop policy if exists "Anon can update site content" on public.site_content;
create policy "Anon can update site content"
on public.site_content
for all
to anon
using (true)
with check (true);
