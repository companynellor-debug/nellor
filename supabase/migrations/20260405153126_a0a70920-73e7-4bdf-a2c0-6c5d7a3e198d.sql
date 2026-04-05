
-- Login attempts tracking
CREATE TABLE public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  success BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User sessions
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT,
  ip_address TEXT,
  device_info TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Login attempts: anyone can insert (for tracking), no one reads directly
CREATE POLICY "Anyone can insert login attempts"
  ON public.login_attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Activity logs: users see their own
CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- User sessions: users see their own
CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RPC: Check if email is blocked (5 failures in 15 min)
CREATE OR REPLACE FUNCTION public.check_login_blocked(_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fail_count INTEGER;
  oldest_fail TIMESTAMPTZ;
  minutes_remaining INTEGER;
BEGIN
  SELECT COUNT(*), MIN(created_at)
  INTO fail_count, oldest_fail
  FROM public.login_attempts
  WHERE email = lower(_email)
    AND success = false
    AND created_at > (now() - interval '15 minutes');

  IF fail_count >= 5 THEN
    minutes_remaining := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (oldest_fail + interval '15 minutes' - now())) / 60));
    RETURN jsonb_build_object('blocked', true, 'minutes_remaining', minutes_remaining);
  END IF;

  RETURN jsonb_build_object('blocked', false, 'attempts', fail_count);
END;
$$;

-- RPC: Record a login attempt
CREATE OR REPLACE FUNCTION public.record_login_attempt(_email TEXT, _success BOOLEAN, _ip_address TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.login_attempts (email, success, ip_address)
  VALUES (lower(_email), _success, _ip_address);

  -- If successful, clear old failures for this email
  IF _success THEN
    DELETE FROM public.login_attempts
    WHERE email = lower(_email) AND success = false;
  END IF;
END;
$$;

-- RPC: Log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  _user_id UUID,
  _action TEXT,
  _description TEXT DEFAULT NULL,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, description, ip_address, user_agent)
  VALUES (_user_id, _action, _description, _ip_address, _user_agent);
END;
$$;

-- RPC: Get user activity logs (last 20)
CREATE OR REPLACE FUNCTION public.get_my_activity_logs()
RETURNS TABLE(
  id UUID,
  action TEXT,
  description TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id, action, description, ip_address, user_agent, created_at
  FROM public.activity_logs
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 20;
$$;

-- Indexes for performance
CREATE INDEX idx_login_attempts_email_created ON public.login_attempts(email, created_at);
CREATE INDEX idx_activity_logs_user_created ON public.activity_logs(user_id, created_at);
CREATE INDEX idx_user_sessions_user_active ON public.user_sessions(user_id, is_active);
