-- Criar storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('avatars', 'avatars', true),
  ('products', 'products', true),
  ('payment_proofs', 'payment_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para bucket de avatars (público)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para bucket de products (público)
CREATE POLICY "Product images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Suppliers can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Suppliers can update their product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Suppliers can delete their product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'products' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para bucket de payment_proofs (privado)
CREATE POLICY "Users can view their own payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment_proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'payment_proofs' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'payment_proofs' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Inserir categorias padrão
INSERT INTO public.categories (nome, slug, imagem_url) VALUES
  ('Roupas', 'roupas', 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f'),
  ('Maquiagens', 'maquiagens', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348'),
  ('Acessórios', 'acessorios', 'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93'),
  ('Eletrônicos', 'eletronicos', 'https://images.unsplash.com/photo-1498049794561-7780e7231661'),
  ('Calçados', 'calcados', 'https://images.unsplash.com/photo-1549298916-b41d501d3772'),
  ('Perfumes', 'perfumes', 'https://images.unsplash.com/photo-1541643600914-78b084683601'),
  ('Decoração', 'decoracao', 'https://images.unsplash.com/photo-1513694203232-719a280e022f'),
  ('Beleza', 'beleza', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9'),
  ('Casa', 'casa', 'https://images.unsplash.com/photo-1484101403633-562f891dc89a')
ON CONFLICT (slug) DO NOTHING;