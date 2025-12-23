-- Create RPC function for admin to update support tickets
CREATE OR REPLACE FUNCTION public.admin_update_support_ticket(
  _ticket_id uuid,
  _resposta_admin text DEFAULT NULL,
  _status support_status DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: usuário não é administrador';
  END IF;

  -- Update the ticket
  UPDATE support_tickets
  SET 
    resposta_admin = COALESCE(_resposta_admin, resposta_admin),
    status = COALESCE(_status, status),
    updated_at = now()
  WHERE id = _ticket_id;

  RETURN FOUND;
END;
$$;