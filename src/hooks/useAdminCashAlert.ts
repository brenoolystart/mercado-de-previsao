import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const MINIMUM_CASH_RESERVE = 1500;

export function useAdminCashAlert() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const navigate = useNavigate();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!user || checkedRef.current) return;

    const checkCashReserve = async () => {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!roleData || !['super_admin', 'admin', 'developer'].includes(roleData.role)) return;

      checkedRef.current = true;

      // Check gateway balance
      const { data: setting } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'gateway_balance')
        .single();

      const balance = Number(setting?.value) || 0;

      if (balance < MINIMUM_CASH_RESERVE) {
        const deficit = MINIMUM_CASH_RESERVE - balance;
        const formatCurrency = (v: number) =>
          new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

        toast({
          title: '⚠️ Caixa abaixo do mínimo para Sports',
          description: `Saldo atual: ${formatCurrency(balance)}. Mínimo necessário: ${formatCurrency(MINIMUM_CASH_RESERVE)}. Faltam ${formatCurrency(deficit)} para compliance. Abasteça o caixa no painel Gateway.`,
          variant: 'destructive',
          duration: 15000,
        });

        // Also show browser notification if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new window.Notification('⚠️ Caixa abaixo do mínimo', {
              body: `Saldo: ${formatCurrency(balance)} — Mínimo: ${formatCurrency(MINIMUM_CASH_RESERVE)}. Abasteça o caixa!`,
              icon: '/icons/icon-192.png',
              tag: 'cash-reserve-alert',
            });
          } catch {
            // ignore
          }
        }
      }
    };

    // Small delay to not block login flow
    const timer = setTimeout(checkCashReserve, 2000);
    return () => clearTimeout(timer);
  }, [user, toast, navigate]);
}
