-- Affiliate commission duration setting (days)
ALTER TABLE public.supplier_affiliate_settings
ADD COLUMN IF NOT EXISTS commission_duration_days integer NOT NULL DEFAULT 120;

-- Commission header: add audit columns
ALTER TABLE public.affiliate_commissions
ADD COLUMN IF NOT EXISTS supplier_id uuid,
ADD COLUMN IF NOT EXISTS order_total numeric,
ADD COLUMN IF NOT EXISTS commission_percent numeric;

-- Prevent duplicate commissions for same order+affiliate
CREATE UNIQUE INDEX IF NOT EXISTS affiliate_commissions_unique_order_affiliate
ON public.affiliate_commissions (order_id, affiliate_id);

-- Commission items (per product) for full auditability
CREATE TABLE IF NOT EXISTS public.affiliate_commission_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES public.affiliate_commissions(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  line_total numeric NOT NULL,
  commission_percent numeric NOT NULL,
  commission_amount numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_commission_items ENABLE ROW LEVEL SECURITY;

-- RLS: admins can manage all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_commission_items' AND policyname='Admins can manage all commission items'
  ) THEN
    CREATE POLICY "Admins can manage all commission items"
    ON public.affiliate_commission_items
    FOR ALL
    USING (has_role(auth.uid(), 'admin'::public.app_role));
  END IF;
END$$;

-- RLS: affiliates can view items for their commissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_commission_items' AND policyname='Affiliates can view their commission items'
  ) THEN
    CREATE POLICY "Affiliates can view their commission items"
    ON public.affiliate_commission_items
    FOR SELECT
    USING (
      commission_id IN (
        SELECT ac.id
        FROM public.affiliate_commissions ac
        JOIN public.affiliates a ON a.id = ac.affiliate_id
        WHERE a.user_id = auth.uid()
      )
    );
  END IF;
END$$;

-- RLS: suppliers can view items for commissions on their orders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='affiliate_commission_items' AND policyname='Suppliers can view commission items on their orders'
  ) THEN
    CREATE POLICY "Suppliers can view commission items on their orders"
    ON public.affiliate_commission_items
    FOR SELECT
    USING (
      commission_id IN (
        SELECT ac.id
        FROM public.affiliate_commissions ac
        WHERE ac.order_id IN (SELECT o.id FROM public.orders o WHERE o.supplier_id = auth.uid())
      )
    );
  END IF;
END$$;

-- Function: create affiliate commission when order is paid (no Stripe payouts here)
CREATE OR REPLACE FUNCTION public.create_affiliate_commission_for_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  o record;
  s record;
  attr record;
  v_order_ts timestamptz;
  v_deadline timestamptz;
  v_default_percent numeric;
  v_total_commission numeric := 0;
  v_weighted_percent numeric := 0;
  v_commission_id uuid;
  item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_unit_price numeric;
  v_line_total numeric;
  v_percent numeric;
  v_line_commission numeric;
BEGIN
  SELECT * INTO o
  FROM public.orders
  WHERE id = _order_id;

  IF o.id IS NULL THEN
    RETURN;
  END IF;

  -- Only for paid orders
  IF o.payment_status IS DISTINCT FROM 'paid'::public.payment_status THEN
    RETURN;
  END IF;

  -- Only for logged-in buyers (attribution sync sets buyer_id)
  IF o.buyer_id IS NULL THEN
    RETURN;
  END IF;

  -- Supplier affiliate settings
  SELECT * INTO s
  FROM public.supplier_affiliate_settings
  WHERE supplier_id = o.supplier_id
  LIMIT 1;

  IF s.supplier_id IS NULL OR COALESCE(s.allow_affiliates, false) = false THEN
    RETURN;
  END IF;

  v_default_percent := COALESCE(s.default_commission_percent, 0);
  IF v_default_percent <= 0 THEN
    RETURN;
  END IF;

  -- Find latest active attribution for this buyer+supplier
  SELECT aa.id, aa.affiliate_link_id, aa.clicked_at, aa.expires_at, al.affiliate_id
  INTO attr
  FROM public.affiliate_attributions aa
  JOIN public.affiliate_links al ON al.id = aa.affiliate_link_id
  WHERE aa.buyer_id = o.buyer_id
    AND aa.supplier_id = o.supplier_id
    AND COALESCE(aa.converted, false) = false
    AND aa.expires_at > now()
  ORDER BY aa.clicked_at DESC NULLS LAST
  LIMIT 1;

  IF attr.id IS NULL THEN
    RETURN;
  END IF;

  v_order_ts := COALESCE(o.paid_at, o.created_at, now());
  v_deadline := COALESCE(attr.clicked_at, now()) + (COALESCE(s.commission_duration_days, 120) || ' days')::interval;

  -- Expired by supplier-defined duration
  IF v_order_ts > v_deadline THEN
    RETURN;
  END IF;

  -- If commission already exists for this order+affiliate, skip
  IF EXISTS (
    SELECT 1
    FROM public.affiliate_commissions ac
    WHERE ac.order_id = o.id
      AND ac.affiliate_id = attr.affiliate_id
  ) THEN
    RETURN;
  END IF;

  -- Iterate items and compute per-product percent (fallback to supplier default)
  IF jsonb_typeof(o.itens) <> 'array' THEN
    RETURN;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(o.itens)
  LOOP
    BEGIN
      v_product_id := (item->>'product_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;

    v_qty := COALESCE((item->>'quantity')::int, 1);
    v_unit_price := COALESCE((item->>'price')::numeric, 0);
    v_line_total := v_unit_price * v_qty;

    -- Product must belong to supplier
    IF NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = v_product_id AND p.supplier_id = o.supplier_id) THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(p.affiliate_commission_percent, v_default_percent)
    INTO v_percent
    FROM public.products p
    WHERE p.id = v_product_id;

    IF v_percent IS NULL OR v_percent <= 0 THEN
      CONTINUE;
    END IF;

    v_line_commission := ROUND((v_line_total * v_percent / 100.0)::numeric, 2);
    v_total_commission := v_total_commission + v_line_commission;
    v_weighted_percent := v_weighted_percent + (v_line_total * v_percent);

  END LOOP;

  IF v_total_commission <= 0 THEN
    RETURN;
  END IF;

  -- Create commission header
  INSERT INTO public.affiliate_commissions (
    affiliate_id,
    amount,
    order_id,
    attribution_id,
    status,
    supplier_id,
    order_total,
    commission_percent
  ) VALUES (
    attr.affiliate_id,
    v_total_commission,
    o.id,
    attr.id,
    'pending'::public.commission_status,
    o.supplier_id,
    o.total,
    ROUND((v_weighted_percent / NULLIF(o.subtotal, 0))::numeric, 2)
  )
  RETURNING id INTO v_commission_id;

  -- Insert commission items (second pass to keep header insert simple)
  FOR item IN SELECT * FROM jsonb_array_elements(o.itens)
  LOOP
    BEGIN
      v_product_id := (item->>'product_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
      CONTINUE;
    END;

    v_qty := COALESCE((item->>'quantity')::int, 1);
    v_unit_price := COALESCE((item->>'price')::numeric, 0);
    v_line_total := v_unit_price * v_qty;

    IF NOT EXISTS (SELECT 1 FROM public.products p WHERE p.id = v_product_id AND p.supplier_id = o.supplier_id) THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(p.affiliate_commission_percent, v_default_percent)
    INTO v_percent
    FROM public.products p
    WHERE p.id = v_product_id;

    IF v_percent IS NULL OR v_percent <= 0 THEN
      CONTINUE;
    END IF;

    v_line_commission := ROUND((v_line_total * v_percent / 100.0)::numeric, 2);

    INSERT INTO public.affiliate_commission_items (
      commission_id,
      product_id,
      quantity,
      unit_price,
      line_total,
      commission_percent,
      commission_amount
    ) VALUES (
      v_commission_id,
      v_product_id,
      v_qty,
      v_unit_price,
      v_line_total,
      v_percent,
      v_line_commission
    );
  END LOOP;

  -- Mark attribution as converted (single conversion)
  UPDATE public.affiliate_attributions
  SET converted = true
  WHERE id = attr.id;

  -- Update affiliate pending earnings
  PERFORM public.update_affiliate_earnings(attr.affiliate_id, v_total_commission);

  -- Increment conversions count
  UPDATE public.affiliate_links
  SET conversions = COALESCE(conversions, 0) + 1
  WHERE id = attr.affiliate_link_id;
END;
$$;

-- Trigger: run when payment becomes paid
CREATE OR REPLACE FUNCTION public.trg_on_order_paid_create_affiliate_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.payment_status = 'paid'::public.payment_status
     AND (OLD.payment_status IS NULL OR OLD.payment_status <> 'paid'::public.payment_status) THEN
    PERFORM public.create_affiliate_commission_for_order(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'orders_on_paid_create_affiliate_commission'
  ) THEN
    CREATE TRIGGER orders_on_paid_create_affiliate_commission
    AFTER UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_on_order_paid_create_affiliate_commission();
  END IF;
END$$;
