
-- Table for GROK3 conversations
CREATE TABLE public.grok3_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Nova conversa',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Table for GROK3 messages
CREATE TABLE public.grok3_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.grok3_conversations(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.grok3_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grok3_messages ENABLE ROW LEVEL SECURITY;

-- RLS: only admins can access their own conversations
CREATE POLICY "Admins can manage own conversations"
ON public.grok3_conversations FOR ALL
USING (auth.uid() = user_id AND is_admin(auth.uid()));

CREATE POLICY "Admins can manage own messages"
ON public.grok3_messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.grok3_conversations c
    WHERE c.id = conversation_id AND c.user_id = auth.uid()
  )
  AND is_admin(auth.uid())
);

-- Index for faster lookups
CREATE INDEX idx_grok3_messages_conversation ON public.grok3_messages(conversation_id, created_at);
CREATE INDEX idx_grok3_conversations_user ON public.grok3_conversations(user_id, updated_at DESC);
