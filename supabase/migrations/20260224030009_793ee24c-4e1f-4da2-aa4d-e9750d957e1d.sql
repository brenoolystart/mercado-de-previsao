
-- Create market_comments table for discussions on markets
CREATE TABLE public.market_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  market_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.market_comments(id) ON DELETE CASCADE,
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.market_comments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view market comments"
  ON public.market_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.market_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.market_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create market_comment_likes table
CREATE TABLE public.market_comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.market_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

ALTER TABLE public.market_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view comment likes"
  ON public.market_comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like comments"
  ON public.market_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike comments"
  ON public.market_comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_market_comments_market_id ON public.market_comments(market_id);
CREATE INDEX idx_market_comments_parent_id ON public.market_comments(parent_id);
CREATE INDEX idx_market_comment_likes_comment_id ON public.market_comment_likes(comment_id);
