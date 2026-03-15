
-- Fix format_brl to always use pt-BR separators regardless of DB locale
CREATE OR REPLACE FUNCTION public.format_brl(value numeric)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT 'R$ ' || REPLACE(REPLACE(REPLACE(TO_CHAR(value, 'FM999G999G999D00'), ',', '#'), '.', ','), '#', '.');
$$;
