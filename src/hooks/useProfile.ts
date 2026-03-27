import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import type { Bet } from '@/hooks/useWallet';
import type { Post } from '@/hooks/useFeed';

export interface ProfileData {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export function useProfile(userId?: string) {
  const { user, profile: myProfile } = useAuthContext();
  const targetId = userId || user?.id;

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [stats, setStats] = useState({ totalBets: 0, activeBets: 0, winRate: 0, totalVolume: 0 });
  const [loading, setLoading] = useState(true);

  const isOwnProfile = user?.id === targetId;

  const fetchProfile = useCallback(async () => {
    if (!targetId) return;

    if (isOwnProfile && myProfile) {
      setProfileData({
        user_id: myProfile.user_id,
        full_name: myProfile.full_name,
        avatar_url: myProfile.avatar_url,
        created_at: myProfile.created_at,
      });
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, created_at')
        .eq('user_id', targetId)
        .single();
      if (data) setProfileData(data as ProfileData);
    }
  }, [targetId, isOwnProfile, myProfile]);

  const fetchPosts = useCallback(async () => {
    if (!targetId) return;
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!data) return;

    const { data: profileInfo } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', targetId)
      .single();

    setPosts(data.map(p => ({
      ...p,
      author_name: profileInfo?.full_name || 'Usuário',
      author_avatar: profileInfo?.avatar_url || null,
      liked_by_me: false,
    })));
  }, [targetId]);

  const fetchBets = useCallback(async () => {
    if (!targetId || !isOwnProfile) return;
    const { data } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', targetId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!data) return;
    const typedBets = data as unknown as Bet[];
    setBets(typedBets);

    const total = typedBets.length;
    const active = typedBets.filter(b => b.status === 'pending').length;
    const won = typedBets.filter(b => b.status === 'won').length;
    const resolved = typedBets.filter(b => b.status === 'won' || b.status === 'lost').length;
    const volume = typedBets.reduce((acc, b) => acc + b.amount, 0);

    setStats({
      totalBets: total,
      activeBets: active,
      winRate: resolved > 0 ? Math.round((won / resolved) * 100) : 0,
      totalVolume: volume,
    });
  }, [targetId, isOwnProfile]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfile(), fetchPosts(), fetchBets()]).finally(() => setLoading(false));
  }, [fetchProfile, fetchPosts, fetchBets]);

  return { profileData, posts, bets, stats, loading, isOwnProfile };
}
