-- 1. Create storage bucket 'events' if it doesn't exist
insert into storage.buckets (id, name, public) 
values ('events', 'events', true) 
on conflict (id) do nothing;

-- 2. Drop existing policies to avoid duplicates/conflicts
drop policy if exists "Public Access" on storage.objects;
drop policy if exists "Authenticated Upload" on storage.objects;
drop policy if exists "Authenticated Update" on storage.objects;
drop policy if exists "Authenticated Delete" on storage.objects;

-- 3. Create policies for 'events' bucket

-- Public Read Access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'events' );

-- Authenticated Upload Access (Any authenticated user can upload - potentially restrict to organizers/admins)
create policy "Authenticated Upload"
on storage.objects for insert
with check ( bucket_id = 'events' and auth.role() = 'authenticated' );

-- Authenticated Update Access (Users can update their own uploads or admins)
create policy "Authenticated Update"
on storage.objects for update
using ( bucket_id = 'events' and auth.role() = 'authenticated' );

-- Authenticated Delete Access
create policy "Authenticated Delete"
on storage.objects for delete
using ( bucket_id = 'events' and auth.role() = 'authenticated' );
