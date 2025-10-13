-- Ensure older objects stored under user_id/ paths remain accessible alongside username/ paths
do $$ 
declare
  pol record;
begin
  for pol in 
    select policyname 
    from pg_policies 
    where schemaname = 'storage' and tablename = 'objects' and policyname in (
      'Users can view their own images',
      'Users can upload their own images',
      'Users can update their own images',
      'Users can delete their own images'
    )
  loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

-- Recreate policies allowing either first folder == username OR == auth.uid()
create policy "Users can view their own images"
on storage.objects for select
using (
  bucket_id = 'user-images' AND (
    (storage.foldername(name))[1] IN (
      select username from public.profiles where id = auth.uid()
    ) OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "Users can upload their own images"
on storage.objects for insert
with check (
  bucket_id = 'user-images' AND (
    (storage.foldername(name))[1] IN (
      select username from public.profiles where id = auth.uid()
    ) OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "Users can update their own images"
on storage.objects for update
using (
  bucket_id = 'user-images' AND (
    (storage.foldername(name))[1] IN (
      select username from public.profiles where id = auth.uid()
    ) OR (storage.foldername(name))[1] = auth.uid()::text
  )
);

create policy "Users can delete their own images"
on storage.objects for delete
using (
  bucket_id = 'user-images' AND (
    (storage.foldername(name))[1] IN (
      select username from public.profiles where id = auth.uid()
    ) OR (storage.foldername(name))[1] = auth.uid()::text
  )
);


