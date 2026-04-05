-- Update trigger function to pass skip_db_insert flag
CREATE OR REPLACE FUNCTION public.send_push_on_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'net'
AS $function$
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
        'type', COALESCE(NEW.data->>'event', NEW.type::text),
        'skip_db_insert', true
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dnl3bm5wY2Jod2FyaHd4Y2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDA3MzMsImV4cCI6MjA3ODExNjczM30.qCf-_-lGRDzL7oWmfwffYoWWoCmybJm6Zu585ArNDzY',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dnl3bm5wY2Jod2FyaHd4Y2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDA3MzMsImV4cCI6MjA3ODExNjczM30.qCf-_-lGRDzL7oWmfwffYoWWoCmybJm6Zu585ArNDzY'
      ),
      timeout_milliseconds := 5000
    );
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Push notification trigger failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$function$;