create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

-- Replace this email with the Supabase Auth user email that should manage the site.
insert into public.admin_users (email)
values ('YOUR_ADMIN_EMAIL@example.com')
on conflict (email) do nothing;

create or replace function public.is_site_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

alter table public.site_content enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Public can read site content" on public.site_content;
create policy "Public can read site content"
on public.site_content
for select
to anon, authenticated
using (true);

drop policy if exists "Anon can update site content" on public.site_content;
drop policy if exists "Admins can insert site content" on public.site_content;
drop policy if exists "Admins can update site content" on public.site_content;

create policy "Admins can insert site content"
on public.site_content
for insert
to authenticated
with check (public.is_site_admin());

create policy "Admins can update site content"
on public.site_content
for update
to authenticated
using (public.is_site_admin())
with check (public.is_site_admin());

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_site_admin());
