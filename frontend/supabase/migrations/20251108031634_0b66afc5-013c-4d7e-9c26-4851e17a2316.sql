-- Trigger para atualizar estoque quando pedido é pago
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Criar trigger para atualizar estoque
DROP TRIGGER IF EXISTS update_stock_on_payment ON public.orders;
CREATE TRIGGER update_stock_on_payment
  AFTER INSERT OR UPDATE OF payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_stock();

-- Adicionar validação de estoque
CREATE OR REPLACE FUNCTION public.validate_order_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  item jsonb;
  product_uuid uuid;
  quantity integer;
  current_stock integer;
  product_name text;
BEGIN
  -- Validar estoque para cada item do pedido
  FOR item IN SELECT * FROM jsonb_array_elements(NEW.itens)
  LOOP
    product_uuid := (item->>'product_id')::uuid;
    quantity := (item->>'quantity')::integer;
    
    -- Buscar estoque atual do produto
    SELECT estoque, nome INTO current_stock, product_name
    FROM public.products
    WHERE id = product_uuid;
    
    -- Verificar se há estoque suficiente
    IF current_stock < quantity THEN
      RAISE EXCEPTION 'Estoque insuficiente para o produto %: disponível %, solicitado %', 
        product_name, current_stock, quantity;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para validar estoque antes de criar pedido
DROP TRIGGER IF EXISTS validate_stock_before_order ON public.orders;
CREATE TRIGGER validate_stock_before_order
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_stock();