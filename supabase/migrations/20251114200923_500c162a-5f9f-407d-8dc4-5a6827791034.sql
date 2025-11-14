-- Fix RLS policies for products table to allow public viewing of active products
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

CREATE POLICY "Active products are viewable by everyone"
ON public.products
FOR SELECT
USING (ativo = true);

CREATE POLICY "Suppliers and admins can view all their products"
ON public.products
FOR SELECT
USING (
  (supplier_id = auth.uid() AND has_role(auth.uid(), 'fornecedor'::app_role)) 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- Fix RLS policies for reviews table to ensure public can read reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;

CREATE POLICY "Reviews are publicly viewable"
ON public.reviews
FOR SELECT
USING (true);

-- Ensure profiles are publicly readable for store information
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Profiles are publicly viewable"
ON public.profiles
FOR SELECT
USING (true);