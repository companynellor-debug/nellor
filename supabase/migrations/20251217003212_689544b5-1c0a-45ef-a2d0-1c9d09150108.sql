-- Corrigir VIEWs para usar SECURITY INVOKER (mais seguro)

-- Recriar VIEW de fornecedores públicos com SECURITY INVOKER
DROP VIEW IF EXISTS public.public_supplier_profiles;

CREATE VIEW public.public_supplier_profiles
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.nome,
  p.foto_perfil_url,
  p.banner_loja_url,
  p.descricao_loja,
  p.ativo,
  p.created_at
FROM public.profiles p
INNER JOIN public.user_roles ur ON ur.user_id = p.id
WHERE ur.role = 'fornecedor'::app_role
  AND p.ativo = true;

GRANT SELECT ON public.public_supplier_profiles TO anon, authenticated;

-- Recriar VIEW de reviews públicos com SECURITY INVOKER
DROP VIEW IF EXISTS public.public_reviews;

CREATE VIEW public.public_reviews
WITH (security_invoker = true)
AS
SELECT 
  r.id,
  r.product_id,
  r.rating,
  r.comment,
  r.photos,
  r.created_at,
  SPLIT_PART(p.nome, ' ', 1) as buyer_first_name
FROM public.reviews r
LEFT JOIN public.profiles p ON p.id = r.buyer_id;

GRANT SELECT ON public.public_reviews TO anon, authenticated;