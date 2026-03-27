import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

const DEMO_DURATION_DAYS = 7;
const DEMO_INITIAL_BALANCE = 5000;

export interface DemoState {
  isActive: boolean;
  startedAt: Date | null;
  balance: number;
  daysRemaining: number;
  expired: boolean;
}

export function useDemo() {
  const { user, isAuthenticated } = useAuthContext();
  const [demoState, setDemoState] = useState<DemoState>({
    isActive: false,
    startedAt: null,
    balance: 0,
    daysRemaining: DEMO_DURATION_DAYS,
    expired: false,
  });
  const [loading, setLoading] = useState(false);

  const fetchDemoState = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('demo_mode_active, demo_started_at, demo_balance')
      .eq('user_id', user.id)
      .single();

    if (error || !data) return;

    const profile = data as any;
    const startedAt = profile.demo_started_at ? new Date(profile.demo_started_at) : null;
    let expired = false;
    let daysRemaining = DEMO_DURATION_DAYS;

    if (startedAt) {
      const now = new Date();
      const diffMs = now.getTime() - startedAt.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      daysRemaining = Math.max(0, Math.ceil(DEMO_DURATION_DAYS - diffDays));
      expired = diffDays >= DEMO_DURATION_DAYS;
    }

    // Auto-deactivate if expired
    if (profile.demo_mode_active && expired) {
      await supabase
        .from('profiles')
        .update({ demo_mode_active: false })
        .eq('user_id', user.id);

      setDemoState({
        isActive: false,
        startedAt,
        balance: profile.demo_balance || 0,
        daysRemaining: 0,
        expired: true,
      });
      return;
    }

    setDemoState({
      isActive: profile.demo_mode_active || false,
      startedAt,
      balance: profile.demo_balance || 0,
      daysRemaining,
      expired,
    });
  }, [user]);

  const activateDemo = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Faça login primeiro' };

    // Check if already used demo before
    const { data: profile } = await supabase
      .from('profiles')
      .select('demo_started_at')
      .eq('user_id', user.id)
      .single();

    if ((profile as any)?.demo_started_at) {
      return { success: false, error: 'Você já utilizou o período de teste' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        demo_mode_active: true,
        demo_started_at: new Date().toISOString(),
        demo_balance: DEMO_INITIAL_BALANCE,
      })
      .eq('user_id', user.id);

    if (error) return { success: false, error: 'Erro ao ativar modo demo' };

    await fetchDemoState();
    return { success: true };
  }, [user, fetchDemoState]);

  const deactivateDemo = useCallback(async () => {
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ demo_mode_active: false })
      .eq('user_id', user.id);

    await fetchDemoState();
  }, [user, fetchDemoState]);

  const placeDemoBet = useCallback(async (amount: number): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Faça login primeiro' };
    if (!demoState.isActive) return { success: false, error: 'Modo demo não está ativo' };
    if (amount > demoState.balance) return { success: false, error: 'Saldo demo insuficiente' };
    if (amount <= 0) return { success: false, error: 'Valor inválido' };

    const newBalance = demoState.balance - amount;
    const { error } = await supabase
      .from('profiles')
      .update({ demo_balance: newBalance })
      .eq('user_id', user.id);

    if (error) return { success: false, error: 'Erro ao processar aposta demo' };

    setDemoState(prev => ({ ...prev, balance: newBalance }));
    return { success: true };
  }, [user, demoState]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDemoState();
    }
  }, [isAuthenticated, fetchDemoState]);

  return {
    demoState,
    loading,
    activateDemo,
    deactivateDemo,
    placeDemoBet,
    refetch: fetchDemoState,
  };
}
