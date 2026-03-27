
-- Referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_user_id UUID,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  referrer_bonus_paid BOOLEAN NOT NULL DEFAULT false,
  referred_bonus_paid BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE
);

-- Unique referral code per referrer
CREATE UNIQUE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE UNIQUE INDEX idx_referrals_referred ON public.referrals(referred_user_id) WHERE referred_user_id IS NOT NULL;

-- Trade bonus tracking table
CREATE TABLE public.trade_bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bonus_type TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, bonus_type)
);

-- RLS for referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_user_id = auth.uid());
CREATE POLICY "Users can insert own referrals" ON public.referrals FOR INSERT TO authenticated WITH CHECK (referrer_id = auth.uid());
CREATE POLICY "Admins can manage referrals" ON public.referrals FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- RLS for trade_bonuses
ALTER TABLE public.trade_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bonuses" ON public.trade_bonuses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage trade bonuses" ON public.trade_bonuses FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.referrals;
