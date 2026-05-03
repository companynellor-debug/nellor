-- Add product_id column to coupons table (nullable - if null, applies to all products from supplier)
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS uso_maximo INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS uso_atual INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS valor_minimo NUMERIC DEFAULT 0;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_coupons_supplier_id ON public.coupons(supplier_id);
CREATE INDEX IF NOT EXISTS idx_coupons_product_id ON public.coupons(product_id);
CREATE INDEX IF NOT EXISTS idx_coupons_codigo ON public.coupons(codigo);

-- Update the policy to allow clients to view active coupons
DROP POLICY IF EXISTS "Active coupons are viewable by everyone" ON public.coupons;
CREATE POLICY "Active coupons are viewable by everyone" 
ON public.coupons 
FOR SELECT 
USING (ativo = true AND (expira_em IS NULL OR expira_em > now()) AND (uso_maximo IS NULL OR uso_atual < uso_maximo));