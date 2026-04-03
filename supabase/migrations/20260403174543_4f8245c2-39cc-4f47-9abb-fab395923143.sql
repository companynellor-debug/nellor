
-- 1. Recalculate vendas_count from real orders
WITH sales AS (
  SELECT
    (item->>'product_id')::uuid AS product_id,
    SUM((item->>'quantity')::int) AS total_qty
  FROM orders o,
    jsonb_array_elements(o.itens) AS item
  WHERE o.order_status != 'cancelled'
    AND jsonb_typeof(o.itens) = 'array'
  GROUP BY 1
),
all_products AS (
  SELECT p.id, COALESCE(s.total_qty, 0) AS real_count
  FROM products p
  LEFT JOIN sales s ON s.product_id = p.id
)
UPDATE products p
SET vendas_count = ap.real_count
FROM all_products ap
WHERE p.id = ap.id AND p.vendas_count IS DISTINCT FROM ap.real_count;

-- 2. Create trigger function
CREATE OR REPLACE FUNCTION public.update_product_sales_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_product_id uuid;
  v_total int;
  v_itens jsonb;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    v_itens := NEW.itens;
    IF jsonb_typeof(v_itens) = 'array' THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_itens)
      LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        IF v_product_id IS NOT NULL THEN
          SELECT COALESCE(SUM((i->>'quantity')::int), 0) INTO v_total
          FROM orders o, jsonb_array_elements(o.itens) i
          WHERE jsonb_typeof(o.itens) = 'array'
            AND (i->>'product_id')::uuid = v_product_id
            AND o.order_status != 'cancelled';
          UPDATE products SET vendas_count = v_total WHERE id = v_product_id;
        END IF;
      END LOOP;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    v_itens := OLD.itens;
    IF jsonb_typeof(v_itens) = 'array' THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(v_itens)
      LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        IF v_product_id IS NOT NULL THEN
          SELECT COALESCE(SUM((i->>'quantity')::int), 0) INTO v_total
          FROM orders o, jsonb_array_elements(o.itens) i
          WHERE jsonb_typeof(o.itens) = 'array'
            AND (i->>'product_id')::uuid = v_product_id
            AND o.order_status != 'cancelled';
          UPDATE products SET vendas_count = v_total WHERE id = v_product_id;
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Create trigger
DROP TRIGGER IF EXISTS trg_update_sales_count ON orders;
CREATE TRIGGER trg_update_sales_count
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_sales_count();
