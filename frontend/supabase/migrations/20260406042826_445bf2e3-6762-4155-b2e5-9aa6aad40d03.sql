-- 1. Add phone_verified columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz DEFAULT NULL;

-- 2. Phone verification codes table (simulated)
CREATE TABLE IF NOT EXISTS public.phone_verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.phone_verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own verification codes"
  ON public.phone_verification_codes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 3. Disputes table
CREATE TABLE IF NOT EXISTS public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  negotiation_id uuid REFERENCES public.negotiations(id) ON DELETE CASCADE NOT NULL,
  buyer_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  reason text NOT NULL DEFAULT 'not_received',
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'scam_confirmed', 'buyer_issue')),
  admin_notes text,
  supplier_response text,
  supplier_responded_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can create disputes" ON public.disputes FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Buyers can view own disputes" ON public.disputes FOR SELECT TO authenticated
  USING (buyer_id = auth.uid());
CREATE POLICY "Suppliers can view their disputes" ON public.disputes FOR SELECT TO authenticated
  USING (supplier_id = auth.uid());
CREATE POLICY "Suppliers can update their disputes" ON public.disputes FOR UPDATE TO authenticated
  USING (supplier_id = auth.uid());
CREATE POLICY "Admins can manage all disputes" ON public.disputes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. RPC to check message limit for new unverified accounts
CREATE OR REPLACE FUNCTION public.check_chat_message_limit(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_created_at timestamptz;
  v_phone_verified boolean;
  v_messages_today integer;
  v_is_new boolean;
BEGIN
  SELECT created_at, COALESCE(phone_verified, false)
  INTO v_created_at, v_phone_verified
  FROM public.profiles
  WHERE id = _user_id;

  IF v_phone_verified THEN
    RETURN jsonb_build_object('allowed', true, 'verified', true, 'remaining', -1);
  END IF;

  v_is_new := (v_created_at > now() - interval '7 days');

  IF NOT v_is_new THEN
    RETURN jsonb_build_object('allowed', true, 'verified', false, 'remaining', -1);
  END IF;

  SELECT COUNT(*) INTO v_messages_today
  FROM public.messages
  WHERE from_user = _user_id
    AND created_at > date_trunc('day', now());

  RETURN jsonb_build_object(
    'allowed', v_messages_today < 5,
    'verified', false,
    'remaining', GREATEST(0, 5 - v_messages_today),
    'is_new_account', true
  );
END;
$$;

-- 5. RPC for admin conversations search
CREATE OR REPLACE FUNCTION public.get_admin_conversations(_search text DEFAULT NULL)
RETURNS TABLE(
  chat_id text,
  user1_id uuid,
  user2_id uuid,
  user1_name text,
  user2_name text,
  last_message text,
  last_message_at timestamptz,
  message_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.chat_id,
    m.from_user as user1_id,
    m.to_user as user2_id,
    p1.nome as user1_name,
    p2.nome as user2_name,
    (SELECT text FROM messages WHERE chat_id = m.chat_id ORDER BY created_at DESC LIMIT 1) as last_message,
    MAX(m.created_at) as last_message_at,
    COUNT(*) as message_count
  FROM messages m
  LEFT JOIN profiles p1 ON p1.id = m.from_user
  LEFT JOIN profiles p2 ON p2.id = m.to_user
  WHERE (_search IS NULL OR _search = ''
    OR p1.nome ILIKE '%' || _search || '%'
    OR p2.nome ILIKE '%' || _search || '%'
    OR m.text ILIKE '%' || _search || '%')
  GROUP BY m.chat_id, m.from_user, m.to_user, p1.nome, p2.nome
  ORDER BY MAX(m.created_at) DESC
  LIMIT 50;
$$;

-- 6. RPC for admin to get messages by chat_id
CREATE OR REPLACE FUNCTION public.get_admin_chat_messages(_chat_id text)
RETURNS TABLE(
  id uuid,
  from_user uuid,
  to_user uuid,
  text text,
  created_at timestamptz,
  from_name text,
  to_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    m.id,
    m.from_user,
    m.to_user,
    m.text,
    m.created_at,
    p1.nome as from_name,
    p2.nome as to_name
  FROM messages m
  LEFT JOIN profiles p1 ON p1.id = m.from_user
  LEFT JOIN profiles p2 ON p2.id = m.to_user
  WHERE m.chat_id = _chat_id
  ORDER BY m.created_at ASC;
$$;

-- 7. RPC for admin disputes
CREATE OR REPLACE FUNCTION public.get_admin_disputes()
RETURNS TABLE(
  id uuid,
  negotiation_id uuid,
  buyer_id uuid,
  supplier_id uuid,
  reason text,
  description text,
  status text,
  admin_notes text,
  supplier_response text,
  supplier_responded_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz,
  buyer_name text,
  supplier_name text,
  product_name text,
  agreed_price numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    d.id, d.negotiation_id, d.buyer_id, d.supplier_id,
    d.reason, d.description, d.status, d.admin_notes,
    d.supplier_response, d.supplier_responded_at, d.resolved_at, d.created_at,
    pb.nome as buyer_name,
    ps.nome as supplier_name,
    n.product_name,
    n.agreed_price
  FROM disputes d
  LEFT JOIN profiles pb ON pb.id = d.buyer_id
  LEFT JOIN profiles ps ON ps.id = d.supplier_id
  LEFT JOIN negotiations n ON n.id = d.negotiation_id
  ORDER BY d.created_at DESC;
$$;

-- 8. Update updated_at trigger on disputes
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Supplier verification check function
CREATE OR REPLACE FUNCTION public.is_supplier_verified(_supplier_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.supplier_applications
    WHERE user_id = _supplier_id
      AND status = 'approved'
  );
$$;