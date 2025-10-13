-- Create image_metadata table to store AI-generated tags per file path
create table if not exists public.image_metadata (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  tags text[] default '{}',
  created_at timestamp with time zone default now(),
  unique (user_id, file_path)
);

-- Enable RLS
alter table public.image_metadata enable row level security;

-- Policies: users can manage only their own rows
create policy if not exists "Users can view their own image metadata"
on public.image_metadata for select
using (auth.uid() = user_id);

create policy if not exists "Users can insert their own image metadata"
on public.image_metadata for insert
with check (auth.uid() = user_id);

create policy if not exists "Users can update their own image metadata"
on public.image_metadata for update
using (auth.uid() = user_id);

create policy if not exists "Users can delete their own image metadata"
on public.image_metadata for delete
using (auth.uid() = user_id);


