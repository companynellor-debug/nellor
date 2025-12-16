-- Enable full row data for realtime UPDATE events
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Ensure messages is included in Supabase realtime publication
DO $$
BEGIN
  -- Add table to publication if not already present
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;