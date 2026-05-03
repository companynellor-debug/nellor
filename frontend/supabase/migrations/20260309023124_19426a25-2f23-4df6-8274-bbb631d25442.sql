
CREATE OR REPLACE FUNCTION public.generate_store_slug(store_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  base_slug := lower(regexp_replace(
    translate(store_name, 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ', 'aaaaaeeeeiiiioooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'),
    '[^a-z0-9]', '', 'g'
  ));
  IF base_slug = '' THEN base_slug := 'loja'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE store_slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || counter::text;
  END LOOP;
  RETURN final_slug;
END;
$$;

-- Generate slugs for existing suppliers
DO $$
DECLARE
  r RECORD;
  new_slug text;
BEGIN
  FOR r IN SELECT id, nome FROM public.profiles WHERE tipo = 'fornecedor' AND store_slug IS NULL LOOP
    new_slug := public.generate_store_slug(r.nome);
    UPDATE public.profiles SET store_slug = new_slug WHERE id = r.id;
  END LOOP;
END;
$$;
