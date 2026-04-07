CREATE OR REPLACE FUNCTION public.admin_confirm_subscription(
  _subscription_id uuid,
  _admin_id uuid,
  _notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE supplier_subscriptions
  SET status = 'active'::subscription_status,
      started_at = now(),
      expires_at = now() + interval '30 days',
      payment_confirmed_by = _admin_id,
      notes = COALESCE(_notes, notes)
  WHERE id = _subscription_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assinatura não encontrada: %', _subscription_id;
  END IF;

  INSERT INTO notifications (user_id, title, body, type, sound, data)
  SELECT supplier_id,
         '✅ Assinatura Ativada!',
         'Sua assinatura foi confirmada e sua loja está ativa no marketplace.',
         'alert'::notification_type,
         true,
         jsonb_build_object('event', 'subscription_activated', 'url', '/fornecedor')
  FROM supplier_subscriptions WHERE id = _subscription_id;
END;
$$;