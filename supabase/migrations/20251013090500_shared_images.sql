-- Table to store public share links for images
create table if not exists public.shared_images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  slug text not null unique,
  created_at timestamp with time zone default now(),
  unique (user_id, file_path)
);

alter table public.shared_images enable row level security;

-- Anyone can select by slug (for public viewing)
create policy if not exists "Anyone can view shared images"
on public.shared_images for select
using (true);

-- Only owner can insert
create policy if not exists "Users can create their share links"
on public.shared_images for insert
with check (auth.uid() = user_id);

-- Only owner can update
create policy if not exists "Users can update their share links"
on public.shared_images for update
using (auth.uid() = user_id);

-- Only owner can delete
create policy if not exists "Users can delete their share links"
on public.shared_images for delete
using (auth.uid() = user_id);


