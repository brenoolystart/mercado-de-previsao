import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type FeatureFlagKey = 
  | 'feature_feed'
  | 'feature_markets'
  | 'feature_deposits'
  | 'feature_withdrawals'
  | 'feature_chat'
  | 'feature_leaderboard';

type FlagsMap = Record<FeatureFlagKey, boolean>;

const DEFAULT_FLAGS: FlagsMap = {
  feature_feed: true,
  feature_markets: true,
  feature_deposits: true,
  feature_withdrawals: true,
  feature_chat: true,
  feature_leaderboard: true,
};

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FlagsMap>(DEFAULT_FLAGS);
  const [loading, setLoading] = useState(true);

  const fetchFlags = useCallback(async () => {
    const { data } = await supabase
      .from('platform_settings')
      .select('key, value')
      .like('key', 'feature_%');

    if (data) {
      const parsed: Partial<FlagsMap> = {};
      data.forEach((item) => {
        const val = item.value;
        parsed[item.key as FeatureFlagKey] = val === true || val === 'true' || val === '"true"';
      });
      setFlags(prev => ({ ...prev, ...parsed }));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFlags();
    const interval = setInterval(fetchFlags, 10000);
    return () => clearInterval(interval);
  }, [fetchFlags]);

  const isEnabled = useCallback((key: FeatureFlagKey) => flags[key] ?? true, [flags]);

  return { flags, loading, isEnabled };
}
