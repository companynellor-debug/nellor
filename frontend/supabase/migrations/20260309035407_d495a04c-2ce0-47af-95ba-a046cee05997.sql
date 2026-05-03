-- Fix slugs that were generated without the suffix
UPDATE public.profiles
SET store_slug = generate_store_slug(nome) || '-' || substring(id::text from 1 for 4)
WHERE tipo = 'fornecedor' 
AND store_slug IS NOT NULL 
AND store_slug != ''
AND store_slug NOT LIKE '%-____';
