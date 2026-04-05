CREATE OR REPLACE FUNCTION public.get_admin_reports()
RETURNS TABLE(
  id uuid,
  reporter_id uuid,
  target_type text,
  target_id uuid,
  reason text,
  description text,
  status text,
  created_at timestamptz,
  reporter_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    r.id,
    r.reporter_id,
    r.target_type,
    r.target_id,
    r.reason,
    r.description,
    r.status,
    r.created_at,
    COALESCE(p.nome, 'Usuário') as reporter_name
  FROM reports r
  LEFT JOIN profiles p ON p.id = r.reporter_id
  ORDER BY r.created_at DESC
  LIMIT 100;
$$;