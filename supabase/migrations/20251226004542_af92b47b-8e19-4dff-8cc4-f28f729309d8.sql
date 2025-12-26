-- Recalcular vendas_count baseado em pedidos pagos existentes
DO $$
DECLARE
  order_rec RECORD;
  item jsonb;
  product_uuid uuid;
  qty integer;
BEGIN
  -- Reset all vendas_count first
  UPDATE public.products SET vendas_count = 0;
  
  -- Loop through all paid orders
  FOR order_rec IN 
    SELECT id, itens FROM public.orders WHERE payment_status = 'paid'
  LOOP
    -- Check if itens is an array
    IF jsonb_typeof(order_rec.itens) = 'array' THEN
      -- Loop through each item
      FOR item IN SELECT * FROM jsonb_array_elements(order_rec.itens)
      LOOP
        BEGIN
          product_uuid := (item->>'product_id')::uuid;
          qty := COALESCE((item->>'quantity')::integer, 1);
          
          IF product_uuid IS NOT NULL THEN
            UPDATE public.products
            SET vendas_count = COALESCE(vendas_count, 0) + qty
            WHERE id = product_uuid;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Ignore invalid product_id
          NULL;
        END;
      END LOOP;
    END IF;
  END LOOP;
END $$;