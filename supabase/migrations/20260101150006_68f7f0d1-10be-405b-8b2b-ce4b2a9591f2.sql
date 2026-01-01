-- Function to update affiliate earnings when a commission is created
CREATE OR REPLACE FUNCTION public.update_affiliate_earnings(_affiliate_id uuid, _amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.affiliates
  SET 
    pending_earnings = COALESCE(pending_earnings, 0) + _amount,
    updated_at = now()
  WHERE id = _affiliate_id;
END;
$$;

-- Grant execute to authenticated users (function is SECURITY DEFINER so it runs with elevated privileges)
GRANT EXECUTE ON FUNCTION public.update_affiliate_earnings(uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_affiliate_earnings(uuid, numeric) TO service_role;