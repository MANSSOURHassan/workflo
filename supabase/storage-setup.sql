-- Create a storage bucket for branding assets
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Set up security policies for the branding bucket
-- Allow public access to view images
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'branding' );

-- Allow authenticated users to upload images
create policy "Authenticated users can upload"
on storage.objects for insert
with check ( bucket_id = 'branding' and auth.role() = 'authenticated' );

-- Allow users to update their own images
create policy "Users can update their own uploads"
on storage.objects for update
using ( bucket_id = 'branding' and auth.uid() = owner );

-- Allow users to delete their own images
create policy "Users can delete their own uploads"
on storage.objects for delete
using ( bucket_id = 'branding' and auth.uid() = owner );
