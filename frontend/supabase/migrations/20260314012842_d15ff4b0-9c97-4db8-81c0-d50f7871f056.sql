-- RPC para o admin listar solicitações de patrocínio com nomes relacionados
CREATE OR REPLACE FUNCTION public.get_admin_sponsorship_requests()
RETURNS TABLE (
  id uuid,
  supplier_id uuid,
  type sponsorship_type,
  product_id uuid,
  banner_image_url text,
  message text,
  status sponsorship_status,
  admin_response text,
  scheduled_date date,
  created_at timestamptz,
  supplier_name text,
  product_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    sr.id,
    sr.supplier_id,
    sr.type,
    sr.product_id,
    sr.banner_image_url,
    sr.message,
    sr.status,
    sr.admin_response,
    sr.scheduled_date,
    sr.created_at,
    p.nome AS supplier_name,
    pr.nome AS product_name
  FROM public.sponsorship_requests sr
  LEFT JOIN public.profiles p ON p.id = sr.supplier_id
  LEFT JOIN public.products pr ON pr.id = sr.product_id
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY sr.created_at DESC;
$$;

-- Notificação automática para admins ao chegar nova solicitação
CREATE OR REPLACE FUNCTION public.notify_new_sponsorship_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_supplier_name text;
  v_request_label text;
BEGIN
  SELECT nome INTO v_supplier_name
  FROM public.profiles
  WHERE id = NEW.supplier_id;

  v_request_label := CASE NEW.type
    WHEN 'banner_homepage'::public.sponsorship_type THEN 'banner na homepage'
    ELSE 'produto em destaque'
  END;

  INSERT INTO public.notifications (user_id, title, body, type, sound, data)
  SELECT
    ur.user_id,
    '📣 Nova Solicitação de Patrocínio',
    COALESCE(v_supplier_name, 'Fornecedor') || ' enviou uma solicitação de ' || v_request_label || '.',
    'alert'::public.notification_type,
    true,
    jsonb_build_object(
      'event', 'sponsorship_request_created',
      'sponsorship_request_id', NEW.id,
      'supplier_id', NEW.supplier_id,
      'type', NEW.type,
      'url', '/admin/patrocinios'
    )
  FROM public.user_roles ur
  WHERE ur.role = 'admin'::public.app_role;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_sponsorship_request ON public.sponsorship_requests;

CREATE TRIGGER trg_notify_new_sponsorship_request
AFTER INSERT ON public.sponsorship_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_sponsorship_request();