
CREATE TABLE public.referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  from_user_id UUID NOT NULL,
  bet_id UUID REFERENCES public.bets(id) ON DELETE CASCADE,
  commission_type TEXT NOT NULL DEFAULT 'direct',
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  commission_rate NUMERIC NOT NULL DEFAULT 0.30,
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own commissions"
  ON public.referral_commissions
  FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid());

CREATE INDEX idx_referral_commissions_referrer ON public.referral_commissions(referrer_id);
CREATE INDEX idx_referral_commissions_from_user ON public.referral_commissions(from_user_id);
