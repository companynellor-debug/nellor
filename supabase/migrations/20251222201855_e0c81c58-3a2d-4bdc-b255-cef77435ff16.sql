-- Schedule the coupon alerts check to run daily at 9 AM UTC
SELECT cron.schedule(
  'check-coupon-alerts-daily',
  '0 9 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://juvywnnpcbhwarhwxcgc.supabase.co/functions/v1/check-coupon-alerts',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1dnl3bm5wY2Jod2FyaHd4Y2djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NDA3MzMsImV4cCI6MjA3ODExNjczM30.qCf-_-lGRDzL7oWmfwffYoWWoCmybJm6Zu585ArNDzY"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);