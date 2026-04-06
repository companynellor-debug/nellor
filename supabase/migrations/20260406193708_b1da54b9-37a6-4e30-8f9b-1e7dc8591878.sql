-- Enum for subscription status
CREATE TYPE public.subscription_status AS ENUM ('active', 'pending', 'expired', 'cancelled');

-- Supplier subscriptions table
CREATE TABLE public.supplier_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.subscription_status NOT NULL DEFAULT 'pending',
  plan_name text NOT NULL DEFAULT 'Mensal',
  price numeric NOT NULL DEFAULT 29,
  started_at timestamptz,
  expires_at timestamptz,
  payment_method text,
  payment_confirmed_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.supplier_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Supplier can read own subscriptions"
  ON public.supplier_subscriptions FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());

CREATE POLICY "Supplier can insert own subscriptions"
  ON public.supplier_subscriptions FOR INSERT TO authenticated
  WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "Supplier can update own subscriptions"
  ON public.supplier_subscriptions FOR UPDATE TO authenticated
  USING (supplier_id = auth.uid());

-- RPC: Get admin subscriptions list
CREATE OR REPLACE FUNCTION public.get_admin_subscriptions()
RETURNS TABLE(
  id uuid, supplier_id uuid, supplier_name text, supplier_email text,
  status text, plan_name text, price numeric, started_at timestamptz,
  expires_at timestamptz, payment_method text, notes text, created_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT s.id, s.supplier_id, p.nome, p.email, s.status::text, s.plan_name, s.price,
    s.started_at, s.expires_at, s.payment_method, s.notes, s.created_at
  FROM supplier_subscriptions s
  LEFT JOIN profiles p ON p.id = s.supplier_id
  ORDER BY s.created_at DESC;
$$;

-- RPC: Admin confirm payment
CREATE OR REPLACE FUNCTION public.admin_confirm_subscription(_subscription_id uuid, _admin_id uuid, _notes text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
  UPDATE supplier_subscriptions
  SET status = 'active', started_at = now(), expires_at = now() + interval '30 days',
      payment_confirmed_by = _admin_id, notes = COALESCE(_notes, notes)
  WHERE id = _subscription_id;

  INSERT INTO notifications (user_id, title, body, type, sound, data)
  SELECT supplier_id, '✅ Assinatura Ativada!', 'Sua assinatura foi confirmada e sua loja está ativa no marketplace.', 'alert', true,
    jsonb_build_object('event', 'subscription_activated', 'url', '/fornecedor')
  FROM supplier_subscriptions WHERE id = _subscription_id;
END;
$$;

-- RPC: Get supplier subscription status
CREATE OR REPLACE FUNCTION public.get_supplier_subscription(_supplier_id uuid)
RETURNS TABLE(id uuid, status text, plan_name text, price numeric, started_at timestamptz, expires_at timestamptz, days_remaining integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT s.id, s.status::text, s.plan_name, s.price, s.started_at, s.expires_at,
    CASE WHEN s.expires_at IS NOT NULL THEN GREATEST(0, EXTRACT(DAY FROM s.expires_at - now())::integer) ELSE NULL END
  FROM supplier_subscriptions s WHERE s.supplier_id = _supplier_id
  ORDER BY s.created_at DESC LIMIT 1;
$$;