-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create trigger function to send push notification when notification is inserted
CREATE OR REPLACE FUNCTION public.send_push_on_notification_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- Get environment variables
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);
  
  -- Fallback to hardcoded URL if setting not available
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://juvywnnpcbhwarhwxcgc.supabase.co';
  END IF;
  
  -- Only send push if we have the service role key configured
  -- The edge function will be called with anon key via pg_net
  -- and will handle the actual push sending
  
  -- Make async HTTP call to send-push-notification edge function
  SELECT extensions.http_post(
    url := supabase_url || '/functions/v1/send-push-notification',
    body := jsonb_build_object(
      'user_id', NEW.user_id::text,
      'title', NEW.title,
      'body', NEW.body,
      'url', COALESCE(NEW.data->>'url', '/'),
      'order_number', COALESCE(NEW.data->>'order_number', ''),
      'type', COALESCE(NEW.data->>'event', NEW.type::text)
    )::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dnl3bm5wY2Jod2FyaHd4Y2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDA3MzMsImV4cCI6MjA3ODExNjczM30.qCf-_-lGRDzL7oWmfwffYoWWoCmybJm6Zu585ArNDzY'
    )
  ) INTO request_id;
  
  -- Log the request for debugging
  RAISE LOG 'Push notification request sent for user % with request_id %', NEW.user_id, request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the insert if push fails
    RAISE LOG 'Failed to send push notification: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Create trigger on notifications table
DROP TRIGGER IF EXISTS trigger_send_push_on_notification ON public.notifications;

CREATE TRIGGER trigger_send_push_on_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_push_on_notification_insert();