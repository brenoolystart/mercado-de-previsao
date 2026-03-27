import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export function useReferral() {
  const { user } = useAuthContext();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);

  const generateCode = useCallback(() => {
    if (!user) return '';
    return user.id.substring(0, 8).toUpperCase();
  }, [user]);

  const fetchReferrals = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const code = generateCode();

    // Check if user already has a referral entry
    const { data: existing } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .eq('referral_code', code)
      .limit(1);

    if (!existing || existing.length === 0) {
      // Create the user's referral code entry
      await supabase.from('referrals').insert({
        referrer_id: user.id,
        referral_code: code,
        status: 'active',
      });
    }

    setReferralCode(code);

    // Get all referrals made by this user
    const { data: refs } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id)
      .order('created_at', { ascending: false });

    const validRefs = (refs || []).filter(r => r.referred_user_id);
    setReferrals(validRefs);

    const earned = validRefs.filter(r => r.referrer_bonus_paid).length * 25;
    setTotalEarned(earned);

    setLoading(false);
  }, [user, generateCode]);

  useEffect(() => {
    fetchReferrals();
  }, [fetchReferrals]);

  const getReferralLink = useCallback(() => {
    if (!referralCode) return '';
    return `https://onchoice.com.br/signup?ref=${referralCode}`;
  }, [referralCode]);

  return { referralCode, referrals, loading, totalEarned, getReferralLink, refetch: fetchReferrals };
}
