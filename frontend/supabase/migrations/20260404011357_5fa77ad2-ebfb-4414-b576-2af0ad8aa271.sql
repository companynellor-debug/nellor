
-- RPC: Admin approves a supplier application
-- Sets application to 'approved', changes profile tipo to 'fornecedor', sends notification
CREATE OR REPLACE FUNCTION public.admin_approve_supplier_application(_application_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
BEGIN
  -- Get the application
  SELECT * INTO v_app
  FROM public.supplier_applications
  WHERE id = _application_id;

  IF v_app.id IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  IF v_app.status NOT IN ('pending', 'under_review') THEN
    RAISE EXCEPTION 'Solicitação já foi processada';
  END IF;

  -- Update application status
  UPDATE public.supplier_applications
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = _application_id;

  -- Update profile to supplier
  UPDATE public.profiles
  SET tipo = 'fornecedor',
      onboarding_completed = false,
      telefone = COALESCE(telefone, v_app.phone),
      document = COALESCE(document, v_app.cpf, v_app.cnpj)
  WHERE id = v_app.user_id;

  -- Send approval notification
  INSERT INTO public.notifications (user_id, title, body, type, sound, data)
  VALUES (
    v_app.user_id,
    '🎉 Sua conta de fornecedor foi aprovada!',
    'Parabéns! Sua solicitação foi aprovada. Complete o onboarding para começar a vender na Nellor.',
    'alert',
    true,
    jsonb_build_object('event', 'supplier_approved', 'url', '/fornecedor')
  );

  RETURN true;
END;
$$;

-- RPC: Admin rejects a supplier application
CREATE OR REPLACE FUNCTION public.admin_reject_supplier_application(_application_id uuid, _reason text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app RECORD;
BEGIN
  IF _reason IS NULL OR trim(_reason) = '' THEN
    RAISE EXCEPTION 'Motivo da rejeição é obrigatório';
  END IF;

  SELECT * INTO v_app
  FROM public.supplier_applications
  WHERE id = _application_id;

  IF v_app.id IS NULL THEN
    RAISE EXCEPTION 'Solicitação não encontrada';
  END IF;

  IF v_app.status NOT IN ('pending', 'under_review') THEN
    RAISE EXCEPTION 'Solicitação já foi processada';
  END IF;

  -- Update application status
  UPDATE public.supplier_applications
  SET status = 'rejected',
      rejection_reason = _reason,
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = _application_id;

  -- Send rejection notification
  INSERT INTO public.notifications (user_id, title, body, type, sound, data)
  VALUES (
    v_app.user_id,
    '❌ Solicitação de fornecedor rejeitada',
    'Motivo: ' || _reason || '. Você poderá enviar uma nova solicitação após 7 dias.',
    'alert',
    true,
    jsonb_build_object('event', 'supplier_rejected', 'url', '/cliente/perfil')
  );

  RETURN true;
END;
$$;
