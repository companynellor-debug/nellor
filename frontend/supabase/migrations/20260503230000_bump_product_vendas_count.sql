-- Auto-increment products.vendas_count when a negotiation becomes "delivered"
CREATE OR REPLACE FUNCTION public.bump_product_vendas_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only bump on transitions INTO 'delivered'
  IF (TG_OP = 'UPDATE' AND NEW.status = 'delivered' AND COALESCE(OLD.status,'') <> 'delivered')
     OR (TG_OP = 'INSERT' AND NEW.status = 'delivered') THEN
    IF NEW.product_id IS NOT NULL THEN
      UPDATE public.products
        SET vendas_count = COALESCE(vendas_count, 0) + COALESCE(NEW.quantity, 1)
        WHERE id = NEW.product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bump_product_vendas_count ON public.negotiations;
CREATE TRIGGER trg_bump_product_vendas_count
AFTER INSERT OR UPDATE OF status ON public.negotiations
FOR EACH ROW
EXECUTE FUNCTION public.bump_product_vendas_count();

-- Backfill: set vendas_count from existing delivered negotiations
UPDATE public.products p
SET vendas_count = sub.total_qty
FROM (
  SELECT product_id, SUM(COALESCE(quantity, 1))::int AS total_qty
  FROM public.negotiations
  WHERE status = 'delivered' AND product_id IS NOT NULL
  GROUP BY product_id
) sub
WHERE sub.product_id = p.id;
