-- Add RLS policies for service providers to manage products of their integrated suppliers

-- 1. Policy for service providers to INSERT products for their integrated suppliers
DROP POLICY IF EXISTS "Service providers can insert products" ON public.products;
CREATE POLICY "Service providers can insert products"
ON public.products FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM service_provider_suppliers sps
    JOIN service_providers sp ON sp.id = sps.service_provider_id
    WHERE sp.user_id = auth.uid()
    AND sps.supplier_id = products.supplier_id
  )
);

-- 2. Policy for service providers to UPDATE products for their integrated suppliers
DROP POLICY IF EXISTS "Service providers can update products" ON public.products;
CREATE POLICY "Service providers can update products"
ON public.products FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM service_provider_suppliers sps
    JOIN service_providers sp ON sp.id = sps.service_provider_id
    WHERE sp.user_id = auth.uid()
    AND sps.supplier_id = products.supplier_id
  )
);

-- 3. Policy for service providers to SELECT products for their integrated suppliers  
DROP POLICY IF EXISTS "Service providers can view their suppliers products" ON public.products;
CREATE POLICY "Service providers can view their suppliers products"
ON public.products FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM service_provider_suppliers sps
    JOIN service_providers sp ON sp.id = sps.service_provider_id
    WHERE sp.user_id = auth.uid()
    AND sps.supplier_id = products.supplier_id
  )
);

-- 4. Policy for service providers to DELETE products for their integrated suppliers
DROP POLICY IF EXISTS "Service providers can delete products" ON public.products;
CREATE POLICY "Service providers can delete products"
ON public.products FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM service_provider_suppliers sps
    JOIN service_providers sp ON sp.id = sps.service_provider_id
    WHERE sp.user_id = auth.uid()
    AND sps.supplier_id = products.supplier_id
  )
);