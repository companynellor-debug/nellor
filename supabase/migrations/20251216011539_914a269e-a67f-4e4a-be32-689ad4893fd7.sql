-- Políticas para permitir leitura pública de dados agregados para o painel admin
-- Orders - permitir SELECT para todos (dados de pedidos são necessários para estatísticas)
CREATE POLICY "Anyone can read orders for stats"
ON public.orders
FOR SELECT
USING (true);

-- Profiles - já tem política pública, mas garantir
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
CREATE POLICY "Profiles are publicly viewable"
ON public.profiles
FOR SELECT
USING (true);

-- Products - já tem política para ativos, adicionar para admins verem todos
DROP POLICY IF EXISTS "Anyone can read all products" ON public.products;
CREATE POLICY "Anyone can read all products"
ON public.products
FOR SELECT
USING (true);