-- Create push notification logs table for auditing
CREATE TABLE public.push_notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'expired')),
  error_message TEXT,
  http_status INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.push_notification_logs ENABLE ROW LEVEL SECURITY;

-- Admin can read all logs
CREATE POLICY "Admin can read all push logs" 
ON public.push_notification_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));

-- Users can read their own logs
CREATE POLICY "Users can read their own push logs" 
ON public.push_notification_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can insert (from edge function)
CREATE POLICY "Service role can insert logs" 
ON public.push_notification_logs 
FOR INSERT 
WITH CHECK (true);

-- Index for faster queries
CREATE INDEX idx_push_notification_logs_user_id ON public.push_notification_logs(user_id);
CREATE INDEX idx_push_notification_logs_status ON public.push_notification_logs(status);
CREATE INDEX idx_push_notification_logs_created_at ON public.push_notification_logs(created_at DESC);