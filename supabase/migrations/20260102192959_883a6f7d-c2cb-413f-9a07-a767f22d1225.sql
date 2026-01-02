-- Fix storage policies for service providers and products

-- 1. Create policy to allow service providers to upload to their integrated suppliers' folders
DROP POLICY IF EXISTS "Service providers can upload product images" ON storage.objects;
CREATE POLICY "Service providers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' AND
  EXISTS (
    SELECT 1 FROM service_provider_suppliers sps
    JOIN service_providers sp ON sp.id = sps.service_provider_id
    WHERE sp.user_id = auth.uid()
    AND sps.supplier_id::text = (storage.foldername(name))[1]
  )
);

-- 2. Create policy to allow service providers to update product images
DROP POLICY IF EXISTS "Service providers can update product images" ON storage.objects;
CREATE POLICY "Service providers can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' AND
  EXISTS (
    SELECT 1 FROM service_provider_suppliers sps
    JOIN service_providers sp ON sp.id = sps.service_provider_id
    WHERE sp.user_id = auth.uid()
    AND sps.supplier_id::text = (storage.foldername(name))[1]
  )
);

-- 3. Create policy to allow service providers to delete product images
DROP POLICY IF EXISTS "Service providers can delete product images" ON storage.objects;
CREATE POLICY "Service providers can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' AND
  EXISTS (
    SELECT 1 FROM service_provider_suppliers sps
    JOIN service_providers sp ON sp.id = sps.service_provider_id
    WHERE sp.user_id = auth.uid()
    AND sps.supplier_id::text = (storage.foldername(name))[1]
  )
);

-- 4. Update banner policies to use has_role correctly with authenticated users
-- First, drop all existing banner policies to recreate them cleanly
DROP POLICY IF EXISTS "Public read access for banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update banner images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete banner images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;

-- Recreate clean banner policies
CREATE POLICY "Banners are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

CREATE POLICY "Admins can insert banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' AND
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);