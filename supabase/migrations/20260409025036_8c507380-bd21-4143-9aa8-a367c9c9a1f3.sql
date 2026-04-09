
CREATE OR REPLACE FUNCTION public.get_chat_participant_profiles(_user_ids uuid[])
RETURNS TABLE(id uuid, nome text, foto_perfil_url text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT p.id, p.nome, p.foto_perfil_url
  FROM public.profiles p
  WHERE p.id = ANY(_user_ids);
$$;
