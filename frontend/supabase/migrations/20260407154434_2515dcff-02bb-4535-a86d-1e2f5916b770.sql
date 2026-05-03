
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS supplier_confirmed_shipping boolean DEFAULT false;
ALTER TABLE public.negotiations ADD COLUMN IF NOT EXISTS shipping_confirmed_at timestamptz;

-- Trigger para descontar estoque quando status muda para 'delivered'
CREATE OR REPLACE FUNCTION public.decrement_stock_on_delivery()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' AND NEW.product_id IS NOT NULL THEN
    UPDATE products SET estoque = GREATEST(estoque - NEW.quantity, 0) WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decrement_stock_on_delivery ON public.negotiations;
CREATE TRIGGER trg_decrement_stock_on_delivery
  BEFORE UPDATE ON public.negotiations
  FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_delivery();
