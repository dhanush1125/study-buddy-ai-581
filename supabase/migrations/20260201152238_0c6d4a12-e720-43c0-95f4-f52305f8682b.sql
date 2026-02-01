-- Create table for parent share links
CREATE TABLE public.parent_share_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  label TEXT -- Optional label like "Mom's link" or "Tutor access"
);

-- Enable RLS
ALTER TABLE public.parent_share_links ENABLE ROW LEVEL SECURITY;

-- Students can manage their own share links
CREATE POLICY "Users can view their own share links"
  ON public.parent_share_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own share links"
  ON public.parent_share_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own share links"
  ON public.parent_share_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own share links"
  ON public.parent_share_links FOR DELETE
  USING (auth.uid() = user_id);

-- Public policy for viewing by token (used by parents without auth)
CREATE POLICY "Anyone can view active links by token"
  ON public.parent_share_links FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));