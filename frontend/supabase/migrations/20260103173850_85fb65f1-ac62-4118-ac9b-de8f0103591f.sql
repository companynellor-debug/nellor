-- Allow anyone to upload to banners bucket (admin access is controlled at app level)
CREATE POLICY "Anyone can upload to banners bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'banners');

-- Allow anyone to update files in banners bucket
CREATE POLICY "Anyone can update banners bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'banners');

-- Allow anyone to delete from banners bucket
CREATE POLICY "Anyone can delete from banners bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'banners');

-- Ensure banners bucket is public for reading
CREATE POLICY "Anyone can read banners bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'banners');