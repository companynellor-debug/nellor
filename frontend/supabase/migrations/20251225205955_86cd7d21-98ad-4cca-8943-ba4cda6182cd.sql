-- Habilitar extensão http para fazer chamadas HTTP de dentro do PostgreSQL
CREATE EXTENSION IF NOT EXISTS http;

-- Função que dispara push notification quando uma notificação é inserida
CREATE OR REPLACE FUNCTION public.send_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supabase_url TEXT;
  service_key TEXT;
  request_body JSONB;
  response RECORD;
BEGIN
  -- Pegar URL e chave do ambiente (configuradas como secrets)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- Se não tiver as configs, usar os valores hardcoded da edge function
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://kpodmhdxlmidozpqusyd.supabase.co';
  END IF;
  
  -- Preparar o body da requisição
  request_body := jsonb_build_object(
    'user_id', NEW.user_id,
    'title', NEW.title,
    'body', NEW.body,
    'url', COALESCE(NEW.data->>'url', '/'),
    'order_number', COALESCE(NEW.data->>'order_number', ''),
    'type', NEW.type::text
  );

  -- Fazer a chamada HTTP para a edge function de push (fire and forget)
  -- Usamos http_post para enviar a notificação push
  BEGIN
    PERFORM http_post(
      supabase_url || '/functions/v1/send-push-notification',
      request_body::text,
      'application/json'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Push notification HTTP call failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- Criar trigger que dispara após INSERT na tabela notifications
DROP TRIGGER IF EXISTS trg_send_push_on_notification ON public.notifications;
CREATE TRIGGER trg_send_push_on_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.send_push_on_notification();