-- Remover políticas antigas do bucket banners
DROP POLICY IF EXISTS "Admin can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload banners" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view banners" ON storage.objects;
DROP POLICY IF EXISTS "Public banner access" ON storage.objects;
DROP POLICY IF EXISTS "Banner images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage banners" ON storage.objects;

-- Política: Qualquer pessoa pode ver banners (público)
CREATE POLICY "Anyone can view banners"
ON storage.objects FOR SELECT
USING (bucket_id = 'banners');

-- Política: Admins podem fazer upload de qualquer arquivo até 20MB
CREATE POLICY "Admins can upload banners"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'banners' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Política: Admins podem atualizar banners
CREATE POLICY "Admins can update banners"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'banners' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Política: Admins podem deletar banners
CREATE POLICY "Admins can delete banners"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'banners' 
  AND public.has_role(auth.uid(), 'admin')
);