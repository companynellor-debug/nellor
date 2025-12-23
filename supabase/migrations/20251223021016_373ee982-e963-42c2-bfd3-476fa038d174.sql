-- Criar trigger para atualizar rating quando uma review é criada/atualizada/deletada
CREATE TRIGGER update_product_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_rating();

-- Sincronizar ratings existentes para todos os produtos
UPDATE public.products p
SET 
  rating_medio = COALESCE((
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM public.reviews r
    WHERE r.product_id = p.id
  ), 0),
  total_reviews = COALESCE((
    SELECT COUNT(*)
    FROM public.reviews r
    WHERE r.product_id = p.id
  ), 0);