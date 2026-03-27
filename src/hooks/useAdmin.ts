import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export type AppRole = 'super_admin' | 'admin' | 'moderator' | 'user' | 'developer';

interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

interface PlatformStats {
  totalUsers: number;
  totalBets: number;
  totalVolume: number;
  totalDeposits: number;
  totalWithdrawals: number;
  pendingBets: number;
  activeBets: number;
  resolvedBets: number;
  totalWon: number;
  totalLost: number;
  platformProfit: number;
  houseEdge: number;
  // Pending contracts metrics
  pendingVolume: number;
  pendingPotentialPayout: number;
  pendingExposure: number; // max platform could lose on pending
  pendingExpectedProfit: number; // expected profit from pending
}

interface UserWithDetails {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: AppRole | null;
  wallet_balance: number;
  total_bets: number;
}

interface GatewayConfig {
  id: string;
  gateway_name: string;
  client_id: string | null;
  client_secret_encrypted: string | null;
  api_endpoint: string | null;
  webhook_url: string | null;
  is_active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

interface PlatformSetting {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
}

export function useAdmin() {
  const { user } = useAuthContext();
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSetting[]>([]);

  const fetchUserRole = useCallback(async () => {
    if (!user) {
      setUserRole(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setUserRole(data.role as AppRole);
    } else {
      setUserRole(null);
    }
    setLoading(false);
  }, [user]);

  const fetchStats = useCallback(async () => {
    if (!userRole || !['super_admin', 'admin', 'moderator', 'developer'].includes(userRole)) return;

    try {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { data: betsData } = await supabase
        .from('bets')
        .select('amount, status, payout_amount');

      const totalBets = betsData?.length || 0;
      const totalVolume = betsData?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;
      const pendingBets = betsData?.filter(b => b.status === 'pending').length || 0;
      const resolvedBets = betsData?.filter(b => ['won', 'lost'].includes(b.status)).length || 0;
      
      // Real profit: sum of lost bets minus payouts on won bets
      const totalLostByUsers = betsData?.filter(b => b.status === 'lost').reduce((sum, b) => sum + Number(b.amount), 0) || 0;
      const totalPayouts = betsData?.filter(b => b.status === 'won').reduce((sum, b) => sum + Number(b.payout_amount || 0), 0) || 0;
      const totalWonByUsers = betsData?.filter(b => b.status === 'won').reduce((sum, b) => sum + Number(b.amount), 0) || 0;
      // Platform profit = what users lost - (payouts - what winners bet)
      const platformProfit = totalLostByUsers - (totalPayouts - totalWonByUsers);
      const houseEdge = totalVolume > 0 ? (platformProfit / totalVolume) * 100 : 0;

      // Pending contracts metrics
      const pendingBetsData = betsData?.filter(b => b.status === 'pending') || [];
      const pendingVolume = pendingBetsData.reduce((sum, b) => sum + Number(b.amount), 0);
      const pendingPotentialPayout = pendingBetsData.reduce((sum, b) => sum + Number(b.payout_amount || 0), 0);
      const pendingExposure = pendingPotentialPayout - pendingVolume; // max platform could lose
      // Expected profit: volume collected minus expected payouts (using price as probability)
      const pendingExpectedProfit = pendingVolume - pendingBetsData.reduce((sum, b) => {
        const price = Number((b as any).price_at_bet || 0.5);
        return sum + Number(b.amount); // simplified: platform keeps the spread
      }, 0) * 0; // We estimate based on: volume * average house edge
      const avgEdge = houseEdge > 0 ? houseEdge / 100 : 0.05;
      const estimatedPendingProfit = pendingVolume * avgEdge;

      const { data: walletsData } = await supabase
        .from('wallets')
        .select('total_deposited, total_withdrawn, total_won, total_lost');

      const totalDeposits = walletsData?.reduce((sum, w) => sum + Number(w.total_deposited), 0) || 0;
      const totalWithdrawals = walletsData?.reduce((sum, w) => sum + Number(w.total_withdrawn), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalBets,
        totalVolume,
        totalDeposits,
        totalWithdrawals,
        pendingBets,
        activeBets: pendingBets,
        resolvedBets,
        totalWon: totalPayouts,
        totalLost: totalLostByUsers,
        platformProfit,
        houseEdge,
        pendingVolume,
        pendingPotentialPayout,
        pendingExposure,
        pendingExpectedProfit: estimatedPendingProfit,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [userRole]);

  const fetchUsers = useCallback(async () => {
    if (!userRole || !['super_admin', 'admin', 'developer'].includes(userRole)) return;

    try {
      // Batch fetch all data in parallel instead of N+1 queries
      const [profilesRes, rolesRes, walletsRes, betsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
        supabase.from('wallets').select('user_id, balance'),
        supabase.from('bets').select('user_id'),
      ]);

      const profiles = profilesRes.data || [];
      const roleMap = new Map((rolesRes.data || []).map(r => [r.user_id, r.role as AppRole]));
      const walletMap = new Map((walletsRes.data || []).map(w => [w.user_id, Number(w.balance)]));
      
      // Count bets per user
      const betCountMap = new Map<string, number>();
      (betsRes.data || []).forEach(b => {
        betCountMap.set(b.user_id, (betCountMap.get(b.user_id) || 0) + 1);
      });

      const usersWithDetails: UserWithDetails[] = profiles.map(profile => ({
        id: profile.user_id,
        email: '',
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        role: roleMap.get(profile.user_id) || null,
        wallet_balance: walletMap.get(profile.user_id) || 0,
        total_bets: betCountMap.get(profile.user_id) || 0,
      }));

      setUsers(usersWithDetails);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, [userRole]);

  const fetchGatewayConfig = useCallback(async () => {
    if (userRole !== 'super_admin' && userRole !== 'developer') return;

    const { data } = await supabase
      .from('gateway_config')
      .select('*')
      .single();

    if (data) {
      setGatewayConfig(data as GatewayConfig);
    }
  }, [userRole]);

  const fetchPlatformSettings = useCallback(async () => {
    if (!userRole || !['super_admin', 'admin', 'developer'].includes(userRole)) return;

    const { data } = await supabase
      .from('platform_settings')
      .select('*');

    if (data) {
      setPlatformSettings(data as PlatformSetting[]);
    }
  }, [userRole]);

  const updateGatewayConfig = async (updates: Record<string, unknown>) => {
    if ((userRole !== 'super_admin' && userRole !== 'developer') || !gatewayConfig) return { error: 'Unauthorized' };

    const { error } = await supabase
      .from('gateway_config')
      .update(updates as never)
      .eq('id', gatewayConfig.id);

    if (!error) {
      await fetchGatewayConfig();
    }

    return { error };
  };

  const updatePlatformSetting = async (key: string, value: unknown) => {
    if (userRole !== 'super_admin' && userRole !== 'developer') return { error: 'Unauthorized' };

    const { error } = await supabase
      .from('platform_settings')
      .update({ value: JSON.stringify(value), updated_by: user?.id })
      .eq('key', key);

    if (!error) {
      await fetchPlatformSettings();
    }

    return { error };
  };

  const updateUserRole = async (userId: string, role: AppRole) => {
    if (userRole !== 'super_admin' && userRole !== 'developer') return { error: 'Unauthorized' };

    const { data: existing } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      return { error };
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      return { error };
    }
  };

  const logAction = async (action: string, targetTable?: string, targetId?: string, oldData?: unknown, newData?: unknown) => {
    if (!user) return;

    await supabase.from('admin_audit_log').insert({
      admin_user_id: user.id,
      action,
      target_table: targetTable,
      target_id: targetId,
      old_data: oldData ? JSON.stringify(oldData) : null,
      new_data: newData ? JSON.stringify(newData) : null,
    });
  };

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  useEffect(() => {
    if (userRole) {
      fetchStats();
      fetchUsers();
      fetchGatewayConfig();
      fetchPlatformSettings();
    }
  }, [userRole, fetchStats, fetchUsers, fetchGatewayConfig, fetchPlatformSettings]);

  const isAdmin = userRole && ['super_admin', 'admin', 'moderator', 'developer'].includes(userRole);
  const isSuperAdmin = userRole === 'super_admin' || userRole === 'developer';
  const isDeveloper = userRole === 'developer';

  return {
    userRole,
    loading,
    isAdmin,
    isSuperAdmin,
    isDeveloper,
    stats,
    users,
    gatewayConfig,
    platformSettings,
    updateGatewayConfig,
    updatePlatformSetting,
    updateUserRole,
    logAction,
    refreshStats: fetchStats,
    refreshUsers: fetchUsers,
  };
}
