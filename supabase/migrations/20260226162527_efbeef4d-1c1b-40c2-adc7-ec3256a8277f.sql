
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'post_like', 'post_comment'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id TEXT NULL,
  actor_id UUID NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Users can update own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Allow inserts from authenticated users (for trigger/service)
CREATE POLICY "Authenticated can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Allow delete own notifications
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger function for post likes
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_owner_id UUID;
  actor_name TEXT;
BEGIN
  -- Get post owner
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  -- Don't notify yourself
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  
  -- Get actor name
  SELECT COALESCE(full_name, 'Alguém') INTO actor_name FROM public.profiles WHERE user_id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, actor_id)
  VALUES (post_owner_id, 'post_like', 'Nova curtida', actor_name || ' curtiu seu post', NEW.post_id::text, NEW.user_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_like();

-- Trigger function for post comments
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_owner_id UUID;
  actor_name TEXT;
BEGIN
  SELECT user_id INTO post_owner_id FROM public.posts WHERE id = NEW.post_id;
  
  IF post_owner_id = NEW.user_id THEN RETURN NEW; END IF;
  
  SELECT COALESCE(full_name, 'Alguém') INTO actor_name FROM public.profiles WHERE user_id = NEW.user_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, reference_id, actor_id)
  VALUES (post_owner_id, 'post_comment', 'Novo comentário', actor_name || ' comentou no seu post', NEW.post_id::text, NEW.user_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_comment();
