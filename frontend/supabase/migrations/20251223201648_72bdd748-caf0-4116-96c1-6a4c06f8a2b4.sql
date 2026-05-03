-- Add stripe_ready field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_ready boolean DEFAULT false;

-- Update existing suppliers with connected Stripe accounts
UPDATE public.profiles
SET stripe_ready = true
WHERE stripe_account_id IS NOT NULL 
AND tipo = 'fornecedor';

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_ready 
ON public.profiles(stripe_ready) 
WHERE tipo = 'fornecedor';

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_ready IS 'Indica se o fornecedor completou toda a configuração do Stripe Connect e pode receber pagamentos';