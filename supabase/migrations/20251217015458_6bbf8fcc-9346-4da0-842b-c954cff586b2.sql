-- Fix storage policy for banners bucket to allow admin uploads
-- Create a dedicated banners bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload banners" ON storage.objects;

-- Allow public read access to banners
CREATE POLICY "Public read access for banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Allow authenticated users to upload banners
CREATE POLICY "Authenticated users can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

-- Allow authenticated users to update banners
CREATE POLICY "Authenticated users can update banners"
ON storage.objects FOR UPDATE
USING (bucket_id = 'banners' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete banners  
CREATE POLICY "Authenticated users can delete banners"
ON storage.objects FOR DELETE
USING (bucket_id = 'banners' AND auth.role() = 'authenticated');