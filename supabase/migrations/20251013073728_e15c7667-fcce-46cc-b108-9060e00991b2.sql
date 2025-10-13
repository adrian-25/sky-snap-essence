-- Create profiles table with username and birthday
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  birthday date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- RLS Policies for profiles
create policy "Users can view their own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles for update
using (auth.uid() = id);

-- Trigger to auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, birthday)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    (new.raw_user_meta_data->>'birthday')::date
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Drop all existing storage policies first
do $$ 
declare
  pol record;
begin
  for pol in 
    select policyname 
    from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname like '%image%'
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

-- New storage policies using username folders
create policy "Users can view their own images"
on storage.objects for select
using (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] IN (
    select username from public.profiles where id = auth.uid()
  )
);

create policy "Users can upload their own images"
on storage.objects for insert
with check (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] IN (
    select username from public.profiles where id = auth.uid()
  )
);

create policy "Users can update their own images"
on storage.objects for update
using (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] IN (
    select username from public.profiles where id = auth.uid()
  )
);

create policy "Users can delete their own images"
on storage.objects for delete
using (
  bucket_id = 'user-images' AND
  (storage.foldername(name))[1] IN (
    select username from public.profiles where id = auth.uid()
  )
);

-- Add updated_at trigger for profiles
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();