-- Remover trigger de validação de estoque temporariamente
DROP TRIGGER IF EXISTS validate_stock_before_order ON orders;

-- Comentar/desabilitar a validação de estoque na função de atualização de estoque
-- para permitir pedidos mesmo sem estoque suficiente
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  item jsonb;
  product_uuid uuid;
  quantity integer;
BEGIN
  -- Só atualiza estoque quando pagamento for confirmado
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Iterar sobre os itens do pedido
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.itens)
    LOOP
      -- Extrair product_id e quantity do item
      product_uuid := (item->>'product_id')::uuid;
      quantity := (item->>'quantity')::integer;
      
      -- Atualizar estoque do produto
      UPDATE public.products
      SET estoque = GREATEST(0, estoque - quantity)
      WHERE id = product_uuid;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;