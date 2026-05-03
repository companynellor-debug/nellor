-- 1. Adicionar coluna de contagem de vendas aos produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS vendas_count integer DEFAULT 0;

-- 2. Criar trigger para atualizar rating_medio e total_reviews quando uma review é inserida/atualizada/deletada
CREATE OR REPLACE FUNCTION public.update_product_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_product_id uuid;
  avg_rating numeric;
  review_count integer;
BEGIN
  -- Determinar o product_id afetado
  IF TG_OP = 'DELETE' THEN
    target_product_id := OLD.product_id;
  ELSE
    target_product_id := NEW.product_id;
  END IF;
  
  -- Calcular nova média e contagem
  SELECT 
    COALESCE(AVG(rating), 0),
    COUNT(*)
  INTO avg_rating, review_count
  FROM public.reviews
  WHERE product_id = target_product_id;
  
  -- Atualizar o produto
  UPDATE public.products
  SET 
    rating_medio = avg_rating,
    total_reviews = review_count
  WHERE id = target_product_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_update_product_review_stats ON public.reviews;

-- Criar trigger
CREATE TRIGGER trg_update_product_review_stats
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_product_review_stats();

-- 3. Criar trigger para atualizar vendas_count quando um pedido é pago
CREATE OR REPLACE FUNCTION public.update_product_sales_count()
RETURNS TRIGGER AS $$
DECLARE
  item jsonb;
  product_uuid uuid;
  qty integer;
BEGIN
  -- Só atualiza quando payment_status muda para 'paid'
  IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN
    -- Verificar se itens é um array
    IF jsonb_typeof(NEW.itens) = 'array' THEN
      -- Iterar pelos itens do pedido
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.itens)
      LOOP
        -- Extrair product_id e quantity
        BEGIN
          product_uuid := (item->>'product_id')::uuid;
          qty := COALESCE((item->>'quantity')::integer, 1);
          
          IF product_uuid IS NOT NULL THEN
            UPDATE public.products
            SET vendas_count = COALESCE(vendas_count, 0) + qty
            WHERE id = product_uuid;
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Ignora itens com product_id inválido
          NULL;
        END;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trg_update_product_sales_count ON public.orders;

-- Criar trigger
CREATE TRIGGER trg_update_product_sales_count
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_product_sales_count();

-- 4. Sincronizar dados existentes - atualizar todas as estatísticas de reviews
UPDATE public.products p
SET 
  rating_medio = COALESCE(stats.avg_rating, 0),
  total_reviews = COALESCE(stats.review_count, 0)
FROM (
  SELECT 
    product_id,
    AVG(rating) as avg_rating,
    COUNT(*) as review_count
  FROM public.reviews
  GROUP BY product_id
) stats
WHERE p.id = stats.product_id;