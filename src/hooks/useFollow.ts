import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export function useFollow(targetUserId: string | undefined) {
  const { user } = useAuthContext();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!targetUserId) return;
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId),
    ]);
    setFollowersCount(followers || 0);
    setFollowingCount(following || 0);
  }, [targetUserId]);

  const checkFollowing = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    const { data } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();
    setIsFollowing(!!data);
  }, [user, targetUserId]);

  const toggleFollow = async () => {
    if (!user || !targetUserId || user.id === targetUserId) return;
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId });
    }
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
  };

  useEffect(() => {
    fetchCounts();
    checkFollowing();
  }, [fetchCounts, checkFollowing]);

  return { isFollowing, followersCount, followingCount, toggleFollow };
}
