-- Enable full row data for realtime updates on orders
ALTER TABLE public.orders REPLICA IDENTITY FULL;

-- Add orders to realtime publication (safe if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
END $$;
