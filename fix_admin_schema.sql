-- 1. Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  first_name text,
  last_name text,
  role text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 3. Create policies
create policy "Public profiles are viewable by everyone" 
on public.profiles for select 
using (true);

create policy "Users can insert their own profile" 
on public.profiles for insert 
with check (auth.uid() = id);

create policy "Users can update their own profile" 
on public.profiles for update 
using (auth.uid() = id);

create policy "Admins can update all profiles" 
on public.profiles for update 
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'administrator', 'Admin', 'Administrator')
  )
);

-- 4. Create function to handle new user signup
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'first_name', 
    new.raw_user_meta_data->>'last_name', 
    new.raw_user_meta_data->>'role'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 5. Create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Backfill existing users into profiles (Run once)
insert into public.profiles (id, email, first_name, last_name, role)
select 
  id, 
  email, 
  raw_user_meta_data->>'first_name', 
  raw_user_meta_data->>'last_name', 
  raw_user_meta_data->>'role'
from auth.users
on conflict (id) do update 
set 
  email = excluded.email,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  role = excluded.role;

-- 7. Grant access to authenticated users
grant all on public.profiles to authenticated;
grant all on public.profiles to service_role;
