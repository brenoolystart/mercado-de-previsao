import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_won: number;
  total_lost: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: 'deposit' | 'withdrawal' | 'bet_placed' | 'bet_won' | 'bet_lost' | 'refund' | 'bonus';
  amount: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  created_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  wallet_id: string;
  market_id: string;
  market_title: string;
  position: 'yes' | 'no';
  amount: number;
  price_at_bet: number;
  potential_payout: number;
  status: 'pending' | 'won' | 'lost' | 'cancelled' | 'refunded';
  resolved_at: string | null;
  payout_amount: number | null;
  created_at: string;
  updated_at: string;
}

export function useWallet() {
  const { user, isAuthenticated } = useAuthContext();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWallet = useCallback(async () => {
    if (!user) {
      setWallet(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          const { data: newWallet, error: createError } = await supabase
            .from('wallets')
            .insert({ user_id: user.id, balance: 0 })
            .select()
            .single();

          if (createError) {
            throw createError;
          }
          setWallet(newWallet as unknown as Wallet);
        } else {
          throw fetchError;
        }
      } else {
        setWallet(data as unknown as Wallet);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
      setError('Erro ao carregar carteira');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setTransactions((data || []) as unknown as Transaction[]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  }, [user]);

  const fetchBets = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setBets((data || []) as unknown as Bet[]);
    } catch (err) {
      console.error('Error fetching bets:', err);
    }
  }, [user]);

  const placeBet = useCallback(async (
    marketId: string,
    marketTitle: string,
    position: 'yes' | 'no',
    amount: number,
    price: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user || !wallet) {
      return { success: false, error: 'Você precisa estar logado' };
    }

    if (amount > wallet.balance) {
      return { success: false, error: 'Saldo insuficiente' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Valor inválido' };
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('place-bet', {
        body: { marketId, marketTitle, position, amount, price },
      });

      if (fnError || data?.error) {
        return { success: false, error: data?.error || 'Erro ao registrar palpite' };
      }

      await Promise.all([fetchWallet(), fetchTransactions(), fetchBets()]);
      return { success: true };
    } catch (err) {
      console.error('Error placing bet:', err);
      return { success: false, error: 'Erro ao registrar palpite' };
    }
  }, [user, wallet, fetchWallet, fetchTransactions, fetchBets]);

  const sellPosition = useCallback(async (
    betId: string,
    sellAmount: number
  ): Promise<{ success: boolean; sellValue?: number; error?: string }> => {
    if (!user || !wallet) {
      return { success: false, error: 'Você precisa estar logado' };
    }
    if (sellAmount <= 0) {
      return { success: false, error: 'Valor inválido' };
    }

    try {
      const { data, error: fnError } = await supabase.functions.invoke('sell-position', {
        body: { betId, sellAmount },
      });

      if (fnError || data?.error) {
        return { success: false, error: data?.error || 'Erro ao vender posição' };
      }

      await Promise.all([fetchWallet(), fetchTransactions(), fetchBets()]);
      return { success: true, sellValue: data?.sellValue };
    } catch (err) {
      console.error('Error selling position:', err);
      return { success: false, error: 'Erro ao vender posição' };
    }
  }, [user, wallet, fetchWallet, fetchTransactions, fetchBets]);

  // Deposit is now handled via PIX gateway/webhook, keeping this for demo mode only
  const deposit = useCallback(async (amount: number): Promise<{ success: boolean; error?: string }> => {
    if (!user || !wallet) {
      return { success: false, error: 'Você precisa estar logado' };
    }
    if (amount <= 0) {
      return { success: false, error: 'Valor inválido' };
    }
    // This path should only be used in demo mode; real deposits go through PIX webhook
    await Promise.all([fetchWallet(), fetchTransactions()]);
    return { success: true };
  }, [user, wallet, fetchWallet, fetchTransactions]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchWallet();
      fetchTransactions();
      fetchBets();
    } else {
      setWallet(null);
      setTransactions([]);
      setBets([]);
      setLoading(false);
    }
  }, [isAuthenticated, fetchWallet, fetchTransactions, fetchBets]);

  return {
    wallet,
    transactions,
    bets,
    loading,
    error,
    placeBet,
    sellPosition,
    deposit,
    refetch: fetchWallet,
  };
}
