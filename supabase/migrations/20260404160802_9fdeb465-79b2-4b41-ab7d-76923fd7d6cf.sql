
-- Fix admin_update_support_ticket to check profiles.tipo instead of user_roles
CREATE OR REPLACE FUNCTION public.admin_update_support_ticket(
  _ticket_id uuid,
  _resposta_admin text DEFAULT NULL,
  _status text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin via profiles table
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tipo = 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
  END IF;

  UPDATE support_tickets
  SET 
    resposta_admin = COALESCE(_resposta_admin, resposta_admin),
    status = COALESCE(_status, status),
    updated_at = now()
  WHERE id = _ticket_id;

  RETURN FOUND;
END;
$$;

-- Create admin function for reports management
CREATE OR REPLACE FUNCTION public.admin_update_report(
  _report_id uuid,
  _status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tipo = 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
  END IF;

  UPDATE reports
  SET status = _status
  WHERE id = _report_id;

  RETURN FOUND;
END;
$$;
