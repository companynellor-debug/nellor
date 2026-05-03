-- Fix background push notifications: use pg_net (net.http_post) instead of non-existent extensions.http_post

-- 1) Replace push trigger function to call Edge Function with proper auth headers
CREATE OR REPLACE FUNCTION public.send_push_on_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net'
AS $$
DECLARE
  supabase_url TEXT;
BEGIN
  supabase_url := current_setting('app.settings.supabase_url', true);

  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://juvywnnpcbhwarhwxcgc.supabase.co';
  END IF;

  BEGIN
    PERFORM net.http_post(
      url := supabase_url || '/functions/v1/send-push-notification',
      body := jsonb_build_object(
        'user_id', NEW.user_id::text,
        'title', NEW.title,
        'body', NEW.body,
        'url', COALESCE(NEW.data->>'url', '/'),
        'order_number', COALESCE(NEW.data->>'order_number', ''),
        'type', COALESCE(NEW.data->>'event', NEW.type::text)
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        -- Supabase Edge Functions require an API key header even when verify_jwt=false
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dnl3bm5wY2Jod2FyaHd4Y2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDA3MzMsImV4cCI6MjA3ODExNjczM30.qCf-_-lGRDzL7oWmfwffYoWWoCmybJm6Zu585ArNDzY',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dnl3bm5wY2Jod2FyaHd4Y2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDA3MzMsImV4cCI6MjA3ODExNjczM30.qCf-_-lGRDzL7oWmfwffYoWWoCmybJm6Zu585ArNDzY'
      ),
      timeout_milliseconds := 5000
    );
  EXCEPTION
    WHEN OTHERS THEN
      -- Never block the original insert
      RAISE LOG 'Push notification trigger failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- 2) Ensure there is only ONE push trigger on notifications
DROP TRIGGER IF EXISTS trigger_send_push_on_notification ON public.notifications;
DROP TRIGGER IF EXISTS trg_send_push_on_notification ON public.notifications;

CREATE TRIGGER trg_send_push_on_notification
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.send_push_on_notification();

-- 3) Remove obsolete function that referenced extensions.http_post
DROP FUNCTION IF EXISTS public.send_push_on_notification_insert();
