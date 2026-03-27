
-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  poll_type TEXT NOT NULL DEFAULT 'social' CHECK (poll_type IN ('social', 'prediction')),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  odds JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'resolved')),
  resolution TEXT,
  total_votes INTEGER NOT NULL DEFAULT 0,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;

-- Anyone can view active polls
CREATE POLICY "Anyone can view active polls"
ON public.polls FOR SELECT
USING (status IN ('active', 'closed', 'resolved'));

-- Admins can manage all polls
CREATE POLICY "Admins can manage polls"
ON public.polls FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Create poll_votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  option_index INTEGER NOT NULL,
  amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view votes"
ON public.poll_votes FOR SELECT
USING (true);

CREATE POLICY "Users can vote"
ON public.poll_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage votes"
ON public.poll_votes FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Create storage bucket for poll images
INSERT INTO storage.buckets (id, name, public) VALUES ('poll-images', 'poll-images', true);

CREATE POLICY "Anyone can view poll images"
ON storage.objects FOR SELECT
USING (bucket_id = 'poll-images');

CREATE POLICY "Admins can upload poll images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'poll-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete poll images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'poll-images' AND is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_polls_updated_at
BEFORE UPDATE ON public.polls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
