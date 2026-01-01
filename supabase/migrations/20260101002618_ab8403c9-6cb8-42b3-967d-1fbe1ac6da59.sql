-- Criar bucket para imagens de categorias
INSERT INTO storage.buckets (id, name, public)
VALUES ('categories', 'categories', true)
ON CONFLICT (id) DO NOTHING;

-- Política para visualização pública
CREATE POLICY "Category images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'categories');

-- Política para admins fazerem upload
CREATE POLICY "Admins can upload category images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'categories' AND public.has_role(auth.uid(), 'admin'));

-- Política para admins atualizarem
CREATE POLICY "Admins can update category images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'categories' AND public.has_role(auth.uid(), 'admin'));

-- Política para admins deletarem
CREATE POLICY "Admins can delete category images"
ON storage.objects FOR DELETE
USING (bucket_id = 'categories' AND public.has_role(auth.uid(), 'admin'));