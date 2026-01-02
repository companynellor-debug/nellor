-- ================================================================
-- ATRIBUIÇÃO PERSISTENTE: múltiplas compras geram múltiplas comissões
-- enquanto a attribution estiver ativa (não expirada)
-- ================================================================

-- 1. Remover a lógica de "converted = true" que bloqueava novas comissões
-- A attribution continua válida enquanto expires_at > now()

-- 2. Recriar função de comissão SEM marcar converted = true
CREATE OR REPLACE FUNCTION public.create_affiliate_commission_for_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  o record;
  s record;
  attr record;
  v_order_ts timestamptz;
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

  -- Only for logged-in buyers
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

  -- Find latest ACTIVE attribution for this buyer+supplier
  -- IMPORTANTE: NÃO filtra por converted, apenas por expires_at
  SELECT aa.id, aa.affiliate_link_id, aa.clicked_at, aa.expires_at, al.affiliate_id
  INTO attr
  FROM public.affiliate_attributions aa
  JOIN public.affiliate_links al ON al.id = aa.affiliate_link_id
  WHERE aa.buyer_id = o.buyer_id
    AND aa.supplier_id = o.supplier_id
    AND aa.expires_at > now()  -- Só verifica se ainda está ativa
  ORDER BY aa.clicked_at DESC NULLS LAST
  LIMIT 1;

  IF attr.id IS NULL THEN
    RETURN;
  END IF;

  v_order_ts := COALESCE(o.paid_at, o.created_at, now());

  -- Check if commission already exists for this specific order
  IF EXISTS (
    SELECT 1
    FROM public.affiliate_commissions ac
    WHERE ac.order_id = o.id
      AND ac.affiliate_id = attr.affiliate_id
  ) THEN
    RETURN;
  END IF;

  -- Iterate items and compute per-product percent
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

  -- Insert commission items
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

  -- NÃO marca converted = true
  -- A attribution permanece ativa para futuras compras

  -- Update affiliate pending earnings
  PERFORM public.update_affiliate_earnings(attr.affiliate_id, v_total_commission);

  -- Increment conversions count
  UPDATE public.affiliate_links
  SET conversions = COALESCE(conversions, 0) + 1
  WHERE id = attr.affiliate_link_id;
END;
$function$;

-- 3. Função para buscar attribution ativa (usada no frontend/checkout)
CREATE OR REPLACE FUNCTION public.get_active_attribution(_buyer_id uuid, _supplier_id uuid)
RETURNS TABLE(
  attribution_id uuid,
  affiliate_id uuid,
  affiliate_link_id uuid,
  clicked_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    aa.id as attribution_id,
    al.affiliate_id,
    aa.affiliate_link_id,
    aa.clicked_at,
    aa.expires_at
  FROM public.affiliate_attributions aa
  JOIN public.affiliate_links al ON al.id = aa.affiliate_link_id
  WHERE aa.buyer_id = _buyer_id
    AND aa.supplier_id = _supplier_id
    AND aa.expires_at > now()
  ORDER BY aa.clicked_at DESC NULLS LAST
  LIMIT 1;
$function$;

-- 4. Garantir que o trigger existe
DROP TRIGGER IF EXISTS orders_on_paid_create_affiliate_commission ON public.orders;
CREATE TRIGGER orders_on_paid_create_affiliate_commission
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_on_order_paid_create_affiliate_commission();