-- FASE 1: PROTEÇÃO DE DADOS PESSOAIS (LGPD)

-- =============================================
-- 1.1 PROTEGER TABELA PROFILES
-- =============================================

-- Remover política que expõe todos os dados publicamente
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;

-- Criar política para usuários verem apenas seu próprio perfil completo
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Criar política para admins verem todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Criar VIEW pública com dados limitados para lojas (fornecedores)
-- Expõe apenas: id, nome da loja, descrição, foto, banner (sem email, telefone, CPF, PIX)
CREATE OR REPLACE VIEW public.public_supplier_profiles AS
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

-- Dar acesso público à VIEW (não expõe dados sensíveis)
GRANT SELECT ON public.public_supplier_profiles TO anon, authenticated;

-- =============================================
-- 1.2 PROTEGER TABELA ORDERS
-- =============================================

-- Remover política que permite qualquer pessoa ver pedidos
DROP POLICY IF EXISTS "Anyone can read orders for stats" ON public.orders;

-- As políticas existentes para buyer, supplier e admin continuam válidas

-- =============================================
-- 1.3 RESTRINGIR CRIAÇÃO DE NOTIFICAÇÕES
-- =============================================

-- Remover política permissiva que permite qualquer INSERT
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

-- Criar política que permite apenas triggers/functions do sistema criar notificações
-- (usando SECURITY DEFINER nas functions já existentes como notify_order_changes)
-- Admins também podem criar notificações manualmente
CREATE POLICY "Only system and admins can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================
-- 1.4 CRIAR VIEW PARA REVIEWS ANÔNIMOS
-- =============================================

-- View que não expõe buyer_id diretamente
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT 
  r.id,
  r.product_id,
  r.rating,
  r.comment,
  r.photos,
  r.created_at,
  -- Mostrar apenas primeiro nome do comprador
  SPLIT_PART(p.nome, ' ', 1) as buyer_first_name
FROM public.reviews r
LEFT JOIN public.profiles p ON p.id = r.buyer_id;

GRANT SELECT ON public.public_reviews TO anon, authenticated;