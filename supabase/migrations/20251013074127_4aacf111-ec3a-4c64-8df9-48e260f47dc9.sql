-- Update storage policies to use username-based folders
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