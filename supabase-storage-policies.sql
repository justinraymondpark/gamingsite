-- Storage Policies for Screenshots Bucket
-- Run this in Supabase SQL Editor to fix "row-level security policy" errors

-- Allow anyone to read (view) images from the screenshots bucket
CREATE POLICY "Public read access for screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'screenshots');

-- Allow anyone to upload images to the screenshots bucket
-- (You can make this more restrictive later if needed)
CREATE POLICY "Public upload for screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'screenshots');

-- Allow anyone to delete images from the screenshots bucket
-- (You can make this more restrictive later if needed)
CREATE POLICY "Public delete for screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'screenshots');

-- Allow anyone to update images in the screenshots bucket
CREATE POLICY "Public update for screenshots"
ON storage.objects FOR UPDATE
USING (bucket_id = 'screenshots');
