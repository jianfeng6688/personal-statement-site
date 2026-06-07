insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public can read site images" on storage.objects;
create policy "Public can read site images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'site-images');

drop policy if exists "Admins can upload site images" on storage.objects;
create policy "Admins can upload site images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'site-images'
  and public.is_site_admin()
);

drop policy if exists "Admins can update site images" on storage.objects;
create policy "Admins can update site images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'site-images'
  and public.is_site_admin()
)
with check (
  bucket_id = 'site-images'
  and public.is_site_admin()
);

drop policy if exists "Admins can delete site images" on storage.objects;
create policy "Admins can delete site images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'site-images'
  and public.is_site_admin()
);
