CREATE OR REPLACE FUNCTION public.admin_approve_supplier_application(_application_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_app RECORD;
  v_event_key TEXT;
BEGIN
  SELECT * INTO v_app
  FROM public.supplier_applications
  WHERE id = _application_id;

  IF v_app.id IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  IF v_app.status NOT IN ('pending', 'under_review') THEN
    RAISE EXCEPTION 'Solicitação já foi processada';
  END IF;

  -- Dedup: prevent duplicate approval notifications
  v_event_key := 'supplier_approved:' || v_app.user_id::text;
  INSERT INTO public.notification_sent_events (event_key) VALUES (v_event_key) ON CONFLICT (event_key) DO NOTHING;
  
  UPDATE public.supplier_applications
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = _application_id;

  UPDATE public.profiles
  SET tipo = 'fornecedor',
      onboarding_completed = false,
      telefone = COALESCE(telefone, v_app.phone),
      document = COALESCE(document, v_app.cpf, v_app.cnpj)
  WHERE id = v_app.user_id;

  -- Only insert notification if dedup succeeded (FOUND = true means insert worked)
  IF FOUND THEN
    INSERT INTO public.notifications (user_id, title, body, type, sound, data)
    VALUES (
      v_app.user_id,
      '🎉 Sua conta de fornecedor foi aprovada!',
      'Parabéns! Sua solicitação foi aprovada. Complete o onboarding para começar a vender na Nellor.',
      'alert',
      true,
      jsonb_build_object('event', 'supplier_approved', 'url', '/fornecedor')
    );
  END IF;

  RETURN true;
END;
$$;