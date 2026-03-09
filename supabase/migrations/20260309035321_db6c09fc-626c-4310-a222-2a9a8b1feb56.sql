-- Generate store_slug for all suppliers that don't have one yet
-- Uses the store name (nome), lowercased, with accents removed and spaces replaced by hyphens
CREATE OR REPLACE FUNCTION public.generate_store_slug(store_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(
    regexp_replace(
      lower(
        translate(
          store_name,
          'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ',
          'aaaaaeeeeiiiioooooouuuucnAAAAAEEEEIIIIOOOOOUUUUCN'
        )
      ),
      '[^a-z0-9\s-]', '', 'g'
    ),
    '[\s]+', '-', 'g'
  )
$$;

-- Update existing suppliers that have no store_slug
UPDATE public.profiles
SET store_slug = generate_store_slug(nome) || '-' || substring(id::text from 1 for 4)
WHERE tipo = 'fornecedor' AND (store_slug IS NULL OR store_slug = '');

-- Create unique index on store_slug to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_store_slug_unique
ON public.profiles (store_slug)
WHERE store_slug IS NOT NULL AND store_slug != '';
