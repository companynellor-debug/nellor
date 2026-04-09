
-- Add last_seen_at and pinned_suppliers to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pinned_suppliers JSONB DEFAULT '[]'::jsonb;

-- Create supplier_stories table
CREATE TABLE public.supplier_stories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT,
  caption TEXT,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'image', 'video')),
  bg_color TEXT DEFAULT '#7c3aed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours')
);

-- Create story_views table
CREATE TABLE public.story_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID NOT NULL REFERENCES public.supplier_stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- Indexes
CREATE INDEX idx_supplier_stories_supplier ON public.supplier_stories(supplier_id);
CREATE INDEX idx_supplier_stories_expires ON public.supplier_stories(expires_at);
CREATE INDEX idx_story_views_story ON public.story_views(story_id);
CREATE INDEX idx_story_views_viewer ON public.story_views(viewer_id);

-- Enable RLS
ALTER TABLE public.supplier_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- RLS for supplier_stories
CREATE POLICY "Anyone authenticated can view active stories"
ON public.supplier_stories FOR SELECT TO authenticated
USING (expires_at > now());

CREATE POLICY "Suppliers can create their own stories"
ON public.supplier_stories FOR INSERT TO authenticated
WITH CHECK (supplier_id = auth.uid());

CREATE POLICY "Suppliers can delete their own stories"
ON public.supplier_stories FOR DELETE TO authenticated
USING (supplier_id = auth.uid());

-- RLS for story_views
CREATE POLICY "Users can register their own views"
ON public.story_views FOR INSERT TO authenticated
WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "Users can see their own views"
ON public.story_views FOR SELECT TO authenticated
USING (viewer_id = auth.uid());

-- Suppliers can see views on their stories (via security definer function to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_story_views(_story_id uuid)
RETURNS TABLE(viewer_id uuid, viewer_name text, viewer_photo text, viewed_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT sv.viewer_id, p.nome, p.foto_perfil_url, sv.viewed_at
  FROM story_views sv
  JOIN profiles p ON p.id = sv.viewer_id
  WHERE sv.story_id = _story_id
  ORDER BY sv.viewed_at DESC;
$$;
