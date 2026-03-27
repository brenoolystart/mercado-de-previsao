
-- Table to track PIX deposit requests
CREATE TABLE public.pix_deposits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  external_id TEXT NOT NULL,
  qr_code TEXT,
  qr_code_base64 TEXT,
  pix_key TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pix_deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY "Users can view own deposits"
ON public.pix_deposits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert own deposits
CREATE POLICY "Users can insert own deposits"
ON public.pix_deposits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all deposits
CREATE POLICY "Admins can view all deposits"
ON public.pix_deposits
FOR SELECT
USING (is_admin(auth.uid()));

-- Service role can update deposits (for webhook)
CREATE POLICY "Service can update deposits"
ON public.pix_deposits
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_pix_deposits_updated_at
BEFORE UPDATE ON public.pix_deposits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
