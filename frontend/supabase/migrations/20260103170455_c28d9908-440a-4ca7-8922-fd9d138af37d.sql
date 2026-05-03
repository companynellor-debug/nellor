-- Drop the existing restrictive SELECT policy for banners
DROP POLICY IF EXISTS "Active banners are viewable by everyone" ON public.banners;

-- Create new policy: Everyone can view active banners
CREATE POLICY "Active banners are viewable by everyone" 
ON public.banners 
FOR SELECT 
USING (ativo = true);

-- Create new policy: Admins can view ALL banners (including inactive ones)
CREATE POLICY "Admins can view all banners" 
ON public.banners 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));