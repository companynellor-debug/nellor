
INSERT INTO storage.buckets (id, name, public) VALUES ('supplier-stories', 'supplier-stories', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view story media"
ON storage.objects FOR SELECT
USING (bucket_id = 'supplier-stories');

CREATE POLICY "Authenticated users can upload story media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'supplier-stories' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own story media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'supplier-stories' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own story media"
ON storage.objects FOR DELETE
USING (bucket_id = 'supplier-stories' AND auth.uid()::text = (storage.foldername(name))[1]);
