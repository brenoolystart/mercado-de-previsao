
-- Create pix_withdrawals table
CREATE TABLE public.pix_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  amount NUMERIC NOT NULL,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL DEFAULT 'cpf',
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  processed_by UUID,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pix_withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can request withdrawals
CREATE POLICY "Users can insert own withdrawals"
ON public.pix_withdrawals FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view own withdrawals
CREATE POLICY "Users can view own withdrawals"
ON public.pix_withdrawals FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
ON public.pix_withdrawals FOR SELECT
USING (is_admin(auth.uid()));

-- Admins can update withdrawals (approve/reject)
CREATE POLICY "Admins can update withdrawals"
ON public.pix_withdrawals FOR UPDATE
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_pix_withdrawals_updated_at
BEFORE UPDATE ON public.pix_withdrawals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Remove user UPDATE on wallets (security fix) - all financial ops go through edge functions
DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;

-- Add admin SELECT policy for transactions (needed for resolve-market)
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
USING (is_admin(auth.uid()));

-- Add admin UPDATE policy for bets (needed for resolve-market)
CREATE POLICY "Admins can update bets"
ON public.bets FOR UPDATE
USING (is_admin(auth.uid()));
