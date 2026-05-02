
-- 1) Update negotiation transition intervals to 5 minutes
CREATE OR REPLACE FUNCTION public.validate_negotiation_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _elapsed INTERVAL;
  _caller_id uuid := auth.uid();
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  IF has_role(_caller_id, 'admin') THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' AND NEW.status NOT IN ('accepted', 'cancelled') THEN
    RAISE EXCEPTION 'Transição inválida: pending só pode ir para accepted ou cancelled';
  END IF;

  IF OLD.status = 'accepted' AND NEW.status NOT IN ('shipped', 'cancelled') THEN
    RAISE EXCEPTION 'Transição inválida: accepted só pode ir para shipped ou cancelled';
  END IF;

  IF OLD.status = 'shipped' AND NEW.status NOT IN ('delivered', 'disputed') THEN
    RAISE EXCEPTION 'Transição inválida: shipped só pode ir para delivered ou disputed';
  END IF;

  IF OLD.status IN ('delivered', 'cancelled', 'disputed') THEN
    RAISE EXCEPTION 'Transição inválida: status "%" é terminal', OLD.status;
  END IF;

  IF NEW.status IN ('accepted', 'shipped') AND _caller_id != OLD.supplier_id THEN
    RAISE EXCEPTION 'Apenas o fornecedor pode aceitar ou marcar envio';
  END IF;

  IF NEW.status = 'delivered' AND _caller_id != OLD.buyer_id THEN
    RAISE EXCEPTION 'Apenas o comprador pode confirmar a entrega';
  END IF;

  IF NEW.status = 'disputed' AND _caller_id != OLD.buyer_id THEN
    RAISE EXCEPTION 'Apenas o comprador pode abrir disputa';
  END IF;

  -- pending -> accepted: min 5 minutes since created_at
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    _elapsed := now() - OLD.created_at;
    IF _elapsed < INTERVAL '5 minutes' THEN
      RAISE EXCEPTION 'Aguarde pelo menos 5 minutos antes de aceitar a negociação. Tempo restante: %',
        (INTERVAL '5 minutes' - _elapsed);
    END IF;
  END IF;

  -- accepted -> shipped: min 5 minutes since updated_at
  IF OLD.status = 'accepted' AND NEW.status = 'shipped' THEN
    _elapsed := now() - OLD.updated_at;
    IF _elapsed < INTERVAL '5 minutes' THEN
      RAISE EXCEPTION 'Aguarde pelo menos 5 minutos após aceitar antes de marcar envio. Tempo restante: %',
        (INTERVAL '5 minutes' - _elapsed);
    END IF;
  END IF;

  -- shipped -> delivered: min 5 minutes since shipping_confirmed_at
  IF OLD.status = 'shipped' AND NEW.status = 'delivered' THEN
    IF OLD.shipping_confirmed_at IS NULL THEN
      RAISE EXCEPTION 'Data de envio não registrada';
    END IF;
    _elapsed := now() - OLD.shipping_confirmed_at;
    IF _elapsed < INTERVAL '5 minutes' THEN
      RAISE EXCEPTION 'Aguarde pelo menos 5 minutos após o envio para confirmar entrega. Tempo restante: %',
        (INTERVAL '5 minutes' - _elapsed);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Harden admin_confirm_subscription so notification insert never blocks the update
CREATE OR REPLACE FUNCTION public.admin_confirm_subscription(
  _subscription_id uuid,
  _admin_id uuid,
  _notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _supplier_id uuid;
BEGIN
  IF NOT has_role(_admin_id, 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem confirmar assinaturas';
  END IF;

  UPDATE supplier_subscriptions
  SET status = 'active'::subscription_status,
      started_at = now(),
      expires_at = now() + interval '30 days',
      payment_confirmed_by = _admin_id,
      notes = COALESCE(_notes, notes)
  WHERE id = _subscription_id
  RETURNING supplier_id INTO _supplier_id;

  IF _supplier_id IS NULL THEN
    RAISE EXCEPTION 'Assinatura não encontrada: %', _subscription_id;
  END IF;

  BEGIN
    INSERT INTO notifications (user_id, title, body, type, sound, data)
    VALUES (
      _supplier_id,
      '✅ Assinatura Ativada!',
      'Sua assinatura foi confirmada e sua loja está ativa no marketplace.',
      'alert'::notification_type,
      true,
      jsonb_build_object('event', 'subscription_activated', 'url', '/fornecedor')
    );
  EXCEPTION WHEN OTHERS THEN
    -- Não falhar a confirmação por erro de notificação
    RAISE NOTICE 'Notificação não enviada: %', SQLERRM;
  END;
END;
$function$;
