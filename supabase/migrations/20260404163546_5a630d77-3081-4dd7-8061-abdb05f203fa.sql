-- Drop the broken policy
DROP POLICY IF EXISTS "Suppliers can manage their own products" ON public.products;

-- Create proper policies for suppliers using profiles.tipo
CREATE POLICY "Suppliers can insert their own products"
ON public.products
FOR INSERT TO authenticated
WITH CHECK (
  supplier_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND tipo = 'fornecedor'
  )
);

CREATE POLICY "Suppliers can update their own products"
ON public.products
FOR UPDATE TO authenticated
USING (
  supplier_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND tipo = 'fornecedor'
  )
)
WITH CHECK (
  supplier_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND tipo = 'fornecedor'
  )
);

CREATE POLICY "Suppliers can delete their own products"
ON public.products
FOR DELETE TO authenticated
USING (
  supplier_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND tipo = 'fornecedor'
  )
);