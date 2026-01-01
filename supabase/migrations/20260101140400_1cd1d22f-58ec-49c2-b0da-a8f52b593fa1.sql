-- RPC to track affiliate clicks + create/update attribution safely (bypass RLS for clicks)

CREATE OR REPLACE FUNCTION public.track_affiliate_click(
  _code text,
  _buyer_id uuid DEFAULT NULL,
  _visitor_id text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_link record;
  v_now timestamptz := now();
  v_expires timestamptz := (now() + interval '4 months');
  v_existing_id uuid;
BEGIN
  SELECT id, affiliate_id, supplier_id, clicks
  INTO v_link
  FROM public.affiliate_links
  WHERE code = _code
  LIMIT 1;

  IF v_link.id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'LINK_NOT_FOUND');
  END IF;

  -- Increment clicks (bypass RLS via SECURITY DEFINER)
  UPDATE public.affiliate_links
  SET clicks = COALESCE(v_link.clicks, 0) + 1
  WHERE id = v_link.id;

  -- If we have a buyer_id, keep only one active attribution per supplier (latest wins)
  IF _buyer_id IS NOT NULL THEN
    SELECT id
    INTO v_existing_id
    FROM public.affiliate_attributions
    WHERE buyer_id = _buyer_id
      AND supplier_id = v_link.supplier_id
      AND COALESCE(converted, false) = false
      AND expires_at > v_now
    ORDER BY clicked_at DESC NULLS LAST
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      UPDATE public.affiliate_attributions
      SET affiliate_link_id = v_link.id,
          clicked_at = v_now,
          expires_at = v_expires
      WHERE id = v_existing_id;
    ELSE
      INSERT INTO public.affiliate_attributions(
        affiliate_link_id,
        supplier_id,
        buyer_id,
        visitor_id,
        clicked_at,
        expires_at,
        converted
      ) VALUES (
        v_link.id,
        v_link.supplier_id,
        _buyer_id,
        _visitor_id,
        v_now,
        v_expires,
        false
      );
    END IF;

  ELSE
    -- Guest: store by visitor_id when provided
    IF _visitor_id IS NOT NULL AND _visitor_id <> '' THEN
      INSERT INTO public.affiliate_attributions(
        affiliate_link_id,
        supplier_id,
        buyer_id,
        visitor_id,
        clicked_at,
        expires_at,
        converted
      ) VALUES (
        v_link.id,
        v_link.supplier_id,
        NULL,
        _visitor_id,
        v_now,
        v_expires,
        false
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'link_id', v_link.id,
    'supplier_id', v_link.supplier_id,
    'affiliate_id', v_link.affiliate_id,
    'clicked_at', v_now,
    'expires_at', v_expires
  );
END;
$$;

-- Allow calling from clients (anon + authenticated)
GRANT EXECUTE ON FUNCTION public.track_affiliate_click(text, uuid, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.track_affiliate_click(text, uuid, text, text) TO authenticated;
