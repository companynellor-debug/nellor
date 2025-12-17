-- Public store profiles via SECURITY DEFINER to keep LGPD (no email/telefone/document/pix)

CREATE OR REPLACE FUNCTION public.get_public_store_profiles()
RETURNS TABLE (
  id uuid,
  nome text,
  descricao_loja text,
  foto_perfil_url text,
  banner_loja_url text,
  ativo boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.nome,
    p.descricao_loja,
    p.foto_perfil_url,
    p.banner_loja_url,
    COALESCE(p.ativo, true) AS ativo,
    p.created_at
  FROM public.profiles p
  WHERE p.tipo = 'fornecedor'::public.user_type
    AND COALESCE(p.ativo, true) = true;
$$;

CREATE OR REPLACE FUNCTION public.get_public_store_profile(_id uuid)
RETURNS TABLE (
  id uuid,
  nome text,
  descricao_loja text,
  foto_perfil_url text,
  banner_loja_url text,
  ativo boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.get_public_store_profiles()
  WHERE id = _id;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_store_profiles() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_store_profile(uuid) TO anon, authenticated;

-- Ensure roles can read banners list in admin via RLS already; no changes here.
