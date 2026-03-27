import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CreditCard, Key, Globe, Webhook, Shield, AlertTriangle, CheckCircle2, Save,
  Eye, EyeOff, Copy, DollarSign, Clock, ArrowDownLeft, ArrowUpRight,
  Users, Wallet, Settings2, Ban, Lock, BarChart3, RefreshCw, QrCode, TrendingDown, Plus, Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PixDeposit {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  external_id: string;
  created_at: string;
  paid_at: string | null;
  purpose: string | null;
  destination: string | null;
  wallet_id: string | null;
}

interface UserWallet {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_won: number;
  total_lost: number;
}

export function AdminGateway() {
  const { gatewayConfig, updateGatewayConfig, stats, platformSettings, updatePlatformSetting, users } = useAdmin();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [clientId, setClientId] = useState(gatewayConfig?.client_id || '');
  const [clientSecret, setClientSecret] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState(gatewayConfig?.api_endpoint || 'https://api.gateway.internal/v2');
  const [webhookUrl, setWebhookUrl] = useState(gatewayConfig?.webhook_url || '');
  const [isActive, setIsActive] = useState(gatewayConfig?.is_active || false);
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deposits, setDeposits] = useState<PixDeposit[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [userWallets, setUserWallets] = useState<UserWallet[]>([]);
  const [loadingWallets, setLoadingWallets] = useState(false);
  const [gatewayBalance, setGatewayBalance] = useState(0);
  const [gatewayBalanceInput, setGatewayBalanceInput] = useState('');
  const [savingBalance, setSavingBalance] = useState(false);
  const [balanceConfirmed, setBalanceConfirmed] = useState(false);
  const [showAdminDeposit, setShowAdminDeposit] = useState(false);
  const [adminDepAmount, setAdminDepAmount] = useState('');
  const [adminDepCpf, setAdminDepCpf] = useState('');
  const [adminDepLoading, setAdminDepLoading] = useState(false);
  const [checkingAdminPix, setCheckingAdminPix] = useState(false);
  const [adminPixStatus, setAdminPixStatus] = useState<string | null>(null);
  const adminPixConfirmedRef = useRef(false);
  const [adminPixData, setAdminPixData] = useState<{ qr_code: string; qr_code_base64: string; deposit_id: string; amount: number } | null>(null);
  const [adminWithdrawalAmount, setAdminWithdrawalAmount] = useState('');
  const [adminWithdrawalTarget, setAdminWithdrawalTarget] = useState('Conta bancária operacional');
  const [adminWithdrawalMemo, setAdminWithdrawalMemo] = useState('Liquidação manual de caixa');
  const [adminTransferAmount, setAdminTransferAmount] = useState('');
  const [adminTransferTarget, setAdminTransferTarget] = useState('Reserva interna → Conta operacional');

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatCurrencyInput = (value: number) => new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const parseCurrencyInput = (value: string) => {
    const sanitized = value.replace(/[^\d,.]/g, '').trim();
    if (!sanitized) return null;

    let normalized = sanitized;

    if (sanitized.includes(',')) {
      normalized = sanitized.replace(/\./g, '').replace(',', '.');
    } else {
      const dotCount = (sanitized.match(/\./g) ?? []).length;

      if (dotCount > 1) {
        normalized = sanitized.replace(/\./g, '');
      } else if (dotCount === 1) {
        const [integerPart, decimalPart = ''] = sanitized.split('.');
        normalized = decimalPart.length === 3 ? `${integerPart}${decimalPart}` : sanitized;
      }
    }

    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const normalizeCurrencyInput = (value: string) => {
    const parsed = parseCurrencyInput(value);
    return parsed === null ? '' : formatCurrencyInput(parsed);
  };

  const isConfirmedStatus = (status: string) => ['confirmed', 'paid'].includes((status || '').toLowerCase());
  const getDepositTarget = (deposit: PixDeposit) => (deposit.destination || deposit.purpose || 'wallet').toLowerCase();
  const isConfirmedDeposit = (deposit: PixDeposit) => isConfirmedStatus(deposit.status);

  // Deposit limits
  const currentMinDeposit = Number(platformSettings?.find(s => s.key === 'min_deposit')?.value) || 5;
  const currentMaxDeposit = Number(platformSettings?.find(s => s.key === 'max_deposit')?.value) || 10000;
  const [minDeposit, setMinDeposit] = useState(currentMinDeposit.toString());
  const [maxDeposit, setMaxDeposit] = useState(currentMaxDeposit.toString());
  const [savingLimits, setSavingLimits] = useState(false);

  useEffect(() => {
    setMinDeposit(currentMinDeposit.toString());
    setMaxDeposit(currentMaxDeposit.toString());
  }, [currentMinDeposit, currentMaxDeposit]);

  useEffect(() => {
    if (gatewayConfig) {
      setClientId(gatewayConfig.client_id || '');
      setApiEndpoint(gatewayConfig.api_endpoint || 'https://api.gateway.internal/v2');
      setWebhookUrl(gatewayConfig.webhook_url || '');
      setIsActive(gatewayConfig.is_active || false);
    }
  }, [gatewayConfig]);

  useEffect(() => {
    fetchDeposits();
    fetchUserWallets();
    fetchGatewayBalance();
  }, []);

  const checkAdminPixPaymentStatus = async (showFeedback = false) => {
    if (!adminPixData?.deposit_id) return false;

    if (showFeedback) setCheckingAdminPix(true);

    try {
      const { data, error } = await supabase
        .from('pix_deposits')
        .select('status, paid_at')
        .eq('id', adminPixData.deposit_id)
        .single();

      if (error || !data) {
        if (showFeedback) {
          toast({ title: 'Não foi possível verificar o PIX', description: 'Tente novamente em alguns segundos.', variant: 'destructive' });
        }
        return false;
      }

      const normalizedStatus = (data.status || 'pending').toLowerCase();
      setAdminPixStatus(normalizedStatus);

      if (isConfirmedStatus(normalizedStatus)) {
        await Promise.all([fetchDeposits(), fetchGatewayBalance()]);

        if (!adminPixConfirmedRef.current) {
          adminPixConfirmedRef.current = true;
          toast({ title: '✅ Pagamento confirmado!', description: 'O saldo do gateway já foi atualizado no painel.' });
        }

        return true;
      }

      if (showFeedback) {
        toast({
          title: 'Pagamento ainda pendente',
          description: 'O QR Code continua válido. Assim que o PIX confirmar, o saldo entra no painel.',
        });
      }

      return false;
    } finally {
      if (showFeedback) setCheckingAdminPix(false);
    }
  };

  useEffect(() => {
    if (!adminPixData?.deposit_id || adminPixConfirmedRef.current) return;

    const interval = window.setInterval(() => {
      void checkAdminPixPaymentStatus(false);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [adminPixData?.deposit_id]);

  const fetchGatewayBalance = async () => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'gateway_balance')
      .single();

    if (error) {
      console.error('Erro ao buscar saldo do gateway:', error);
      return;
    }

    const rawValue = data?.value;
    const parsedValue = typeof rawValue === 'number'
      ? rawValue
      : typeof rawValue === 'string'
        ? parseCurrencyInput(rawValue)
        : Number(rawValue);

    if (parsedValue !== null && Number.isFinite(parsedValue)) {
      setGatewayBalance(parsedValue);
      setGatewayBalanceInput(formatCurrencyInput(parsedValue));
    }
  };

  const handleSaveGatewayBalance = async () => {
    const value = parseCurrencyInput(gatewayBalanceInput);

    if (value === null || value < 0) {
      toast({ title: 'Valor inválido', description: 'Use formatos como 2.640,00 ou 2640.', variant: 'destructive' });
      return;
    }

    setSavingBalance(true);

    try {
      const previousBalance = gatewayBalance;
      const { error } = await supabase
        .from('platform_settings')
        .upsert(
          {
            key: 'gateway_balance',
            value,
            description: 'Saldo atual do gateway de pagamento',
            updated_by: user?.id ?? null,
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      if (user?.id) {
        const { error: auditError } = await supabase.from('admin_audit_log').insert({
          admin_user_id: user.id,
          action: 'gateway_balance_manual_update',
          target_table: 'platform_settings',
          target_id: 'gateway_balance',
          old_data: { value: previousBalance },
          new_data: { value },
        });

        if (auditError) {
          console.error('Erro ao registrar auditoria do gateway:', auditError);
        }
      }

      setGatewayBalance(value);
      setGatewayBalanceInput(formatCurrencyInput(value));
      setBalanceConfirmed(true);
      toast({ title: '✅ Saldo do gateway atualizado!', description: `Novo saldo: ${formatCurrency(value)}` });
      window.setTimeout(() => setBalanceConfirmed(false), 5000);
    } catch (error) {
      console.error('Erro ao salvar saldo do gateway:', error);
      toast({ title: 'Erro ao salvar saldo', description: 'O valor não foi persistido no backend.', variant: 'destructive' });
    } finally {
      setSavingBalance(false);
    }
  };

  const fetchDeposits = async () => {
    setLoadingDeposits(true);
    const { data } = await supabase
      .from('pix_deposits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setDeposits((data as unknown as PixDeposit[]) || []);
    setLoadingDeposits(false);
  };

  const fetchUserWallets = async () => {
    setLoadingWallets(true);
    try {
      const { data: wallets } = await supabase
        .from('wallets')
        .select('*')
        .order('balance', { ascending: false });

      if (!wallets) { setLoadingWallets(false); return; }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url');

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const combined: UserWallet[] = wallets.map(w => {
        const profile = profileMap.get(w.user_id);
        return {
          user_id: w.user_id,
          full_name: profile?.full_name || null,
          avatar_url: profile?.avatar_url || null,
          balance: Number(w.balance),
          total_deposited: Number(w.total_deposited),
          total_withdrawn: Number(w.total_withdrawn),
          total_won: Number(w.total_won),
          total_lost: Number(w.total_lost),
        };
      });

      setUserWallets(combined);
    } catch (e) {
      console.error('Error fetching wallets:', e);
    }
    setLoadingWallets(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates: Record<string, unknown> = { client_id: clientId, api_endpoint: apiEndpoint, webhook_url: webhookUrl, is_active: isActive };
    if (clientSecret) updates.client_secret_encrypted = clientSecret;
    const { error } = await updateGatewayConfig(updates);
    toast(error ? { title: 'Erro ao salvar', variant: 'destructive' as const } : { title: 'Configurações salvas!' });
    setSaving(false);
  };

  const handleSaveLimits = async () => {
    setSavingLimits(true);
    try {
      await supabase.from('platform_settings').upsert(
        { key: 'min_deposit', value: JSON.stringify(Number(minDeposit)), description: 'Valor mínimo de depósito PIX', updated_by: null },
        { onConflict: 'key' }
      );
      await supabase.from('platform_settings').upsert(
        { key: 'max_deposit', value: JSON.stringify(Number(maxDeposit)), description: 'Valor máximo de depósito PIX', updated_by: null },
        { onConflict: 'key' }
      );
      toast({ title: 'Limites de depósito atualizados!' });
    } catch {
      toast({ title: 'Erro ao salvar limites', variant: 'destructive' });
    }
    setSavingLimits(false);
  };

  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast({ title: 'Copiado!' }); };

  const formatCpfInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const handleAdminDeposit = async () => {
    const amount = parseCurrencyInput(adminDepAmount);
    if (amount === null || amount < 1) {
      toast({ title: 'Valor inválido', description: 'Use formatos como 2.640,00 ou 2640.', variant: 'destructive' });
      return;
    }

    const cpfDigits = adminDepCpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast({ title: 'CPF inválido', variant: 'destructive' });
      return;
    }

    setAdminDepLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pix', {
        body: { amount, document: cpfDigits, purpose: 'gateway' },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao gerar PIX');
      adminPixConfirmedRef.current = false;
      setAdminPixStatus('pending');
      setAdminPixData(data);
      setAdminDepAmount(formatCurrencyInput(amount));
      toast({ title: 'QR Code gerado!', description: 'Pague o PIX e use “Verificar pagamento” para atualizar o saldo imediatamente.' });
      await fetchDeposits();
    } catch (err: any) {
      toast({ title: err.message || 'Erro ao gerar PIX', variant: 'destructive' });
    } finally {
      setAdminDepLoading(false);
    }
  };

  const handleAdminWithdrawalPreview = () => {
    const amount = parseCurrencyInput(adminWithdrawalAmount);

    if (amount === null || amount <= 0) {
      toast({ title: 'Valor inválido', description: 'Informe um valor de saque válido.', variant: 'destructive' });
      return;
    }

    if (amount > safeOperationalWithdrawal) {
      const refillNeeded = Math.max(requiredGatewayReserve + amount - gatewayBalance, 0);
      toast({
        title: 'Abasteça o caixa antes de liberar',
        description: `Para manter o dinheiro dos usuários seguro, reforce ${formatCurrency(refillNeeded)} antes dessa retirada.`,
        variant: 'destructive',
      });
      setShowAdminDeposit(true);
      setAdminPixData(null);
      setAdminDepAmount(Math.ceil(refillNeeded).toString());
      setAdminDepCpf('');
      return;
    }

    toast({
      title: 'Saque interno encaminhado',
      description: `${formatCurrency(amount)} enviado para ${adminWithdrawalTarget}${adminWithdrawalMemo ? ` • ${adminWithdrawalMemo}` : ''}. O saldo dos usuários continua protegido.`,
    });
  };

  const handleInternalTransferPreview = () => {
    const amount = parseCurrencyInput(adminTransferAmount);

    if (amount === null || amount <= 0) {
      toast({ title: 'Valor inválido', description: 'Informe um valor para a transferência.', variant: 'destructive' });
      return;
    }

    if (amount > gatewayBalance) {
      toast({
        title: 'Saldo operacional insuficiente',
        description: 'Essa transferência interna exige abastecimento prévio do caixa.',
        variant: 'destructive',
      });
      setShowAdminDeposit(true);
      setAdminPixData(null);
      setAdminDepAmount(Math.ceil(amount - gatewayBalance).toString());
      setAdminDepCpf('');
      return;
    }

    toast({
      title: 'Transferência interna registrada',
      description: `${formatCurrency(amount)} roteado para ${adminTransferTarget} com proteção de liquidez ativa.`,
    });
  };

  const getAdminQrSrc = () => {
    if (!adminPixData) return '';
    const base64 = (adminPixData.qr_code_base64 || '').trim();
    if (base64) {
      if (base64.startsWith('data:') || base64.startsWith('http')) return base64;
      return `data:image/png;base64,${base64.replace(/\s/g, '')}`;
    }
    if (adminPixData.qr_code) {
      return `https://quickchart.io/qr?size=280&text=${encodeURIComponent(adminPixData.qr_code)}`;
    }
    return '';
  };

  const isConfigured = !!(clientId && gatewayConfig?.client_secret_encrypted);
  const feePercent = Number(platformSettings?.find(s => s.key === 'platform_fee_percentage')?.value) || 2.5;

  const walletDeposits = deposits.filter((deposit) => getDepositTarget(deposit) === 'wallet');
  const gatewayFundingDeposits = deposits.filter((deposit) => getDepositTarget(deposit) === 'gateway');
  const confirmedDeposits = deposits.filter(isConfirmedDeposit);
  const confirmedWalletDeposits = walletDeposits.filter(isConfirmedDeposit);
  const confirmedGatewayFunding = gatewayFundingDeposits.filter(isConfirmedDeposit);
  const pendingDeposits = deposits.filter((deposit) => (deposit.status || '').toLowerCase() === 'pending');
  const expiredDeposits = deposits.filter((deposit) => (deposit.status || '').toLowerCase() === 'expired');
  const totalDeposited = confirmedWalletDeposits.reduce((sum, deposit) => sum + Number(deposit.amount), 0);
  const totalGatewayFunding = confirmedGatewayFunding.reduce((sum, deposit) => sum + Number(deposit.amount), 0);
  const todayDeposits = confirmedWalletDeposits.filter((deposit) => {
    const today = new Date();
    const depositDate = new Date(deposit.created_at);
    return depositDate.toDateString() === today.toDateString();
  });
  const todayTotal = todayDeposits.reduce((sum, deposit) => sum + Number(deposit.amount), 0);
  const totalBalance = userWallets.reduce((sum, wallet) => sum + wallet.balance, 0);
  const minimumLiquidityBuffer = 500;
  const requiredGatewayReserve = totalBalance + minimumLiquidityBuffer;
  const gatewayTopUpNeeded = Math.max(requiredGatewayReserve - gatewayBalance, 0);
  const safeOperationalWithdrawal = Math.max(gatewayBalance - requiredGatewayReserve, 0);

  const userNameMap = new Map(userWallets.map((wallet) => [wallet.user_id, wallet.full_name || wallet.user_id.slice(0, 8)]));

  const statusBadge = (status: string) => {
    const normalizedStatus = (status || '').toLowerCase();

    switch (normalizedStatus) {
      case 'confirmed':
      case 'paid':
        return <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-[10px]">Confirmado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="text-[10px]">Pendente</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-muted-foreground text-[10px]">Expirado</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const depositTargetBadge = (deposit: PixDeposit) => {
    const target = getDepositTarget(deposit);

    if (target === 'gateway') {
      return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">Caixa</Badge>;
    }

    return <Badge variant="outline" className="text-[10px]">Carteira</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <Card className={`border-2 ${isActive && isConfigured ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-amber-500/30 bg-amber-500/5'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isActive && isConfigured ? <CheckCircle2 className="h-6 w-6 text-emerald-500" /> : <AlertTriangle className="h-6 w-6 text-amber-500" />}
              <div>
                <p className="font-semibold">{isActive && isConfigured ? 'Gateway de Pagamento Ativo' : 'Gateway Aguardando Configuração'}</p>
                <p className="text-sm text-muted-foreground">Sistema integrado de pagamentos PIX</p>
              </div>
            </div>
            <Badge variant={isActive && isConfigured ? 'default' : 'secondary'} className="text-xs">
              {isActive && isConfigured ? '● Online' : 'Configurar'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Controle de Caixa do Gateway */}
      {(() => {
        const safetyMargin = 500;
        const requiredBalance = totalBalance + safetyMargin;
        const deficit = requiredBalance - gatewayBalance;
        const coveragePercent = totalBalance > 0 ? Math.min((gatewayBalance / totalBalance) * 100, 999) : 100;
        const isHealthy = gatewayBalance >= requiredBalance;
        const isCritical = gatewayBalance < totalBalance;
        const isWarning = !isCritical && !isHealthy;

        return (
          <>
            {/* ALERTA CRÍTICO - aparece no topo quando saldo insuficiente */}
            {isCritical && (
              <Card className="border-2 border-red-500 bg-red-500/10 animate-pulse">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-red-500">🚨 CAIXA INSUFICIENTE — SAQUES BLOQUEADOS</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        O saldo do gateway ({formatCurrency(gatewayBalance)}) está <strong>abaixo</strong> do total que os usuários podem sacar ({formatCurrency(totalBalance)}). 
                        Isso significa que <strong>saques estão sendo recusados</strong> e a confiança da plataforma está em risco.
                      </p>
                      <p className="text-sm font-semibold text-red-400 mt-2">
                        Deposite agora pelo menos {formatCurrency(deficit)} para normalizar a operação.
                      </p>
                    </div>
                    <Button variant="destructive" size="lg" onClick={() => { setShowAdminDeposit(true); setAdminPixData(null); setAdminDepAmount(Math.ceil(deficit).toString()); setAdminDepCpf(''); }}>
                      <Plus className="h-4 w-4 mr-2" /> Depositar Agora
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {isWarning && (
              <Card className="border-2 border-amber-500/50 bg-amber-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-500">⚠️ Margem de Segurança Insuficiente</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        O caixa cobre os saques atuais, mas sem margem. Se vários usuários sacarem ao mesmo tempo, haverá problemas. 
                        Deposite pelo menos <strong>{formatCurrency(deficit)}</strong> para atingir a margem mínima recomendada.
                      </p>
                    </div>
                    <Button variant="outline" onClick={() => { setShowAdminDeposit(true); setAdminPixData(null); setAdminDepAmount(Math.ceil(deficit).toString()); setAdminDepCpf(''); }}>
                      <Plus className="h-4 w-4 mr-2" /> Reforçar Caixa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className={`border-2 ${isCritical ? 'border-red-500/30 bg-red-500/5' : isWarning ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wallet className={`h-5 w-5 ${isCritical ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}`} /> 
                  Controle de Caixa — Livro-Caixa da Operação
                </CardTitle>
                <CardDescription>
                  Gerencie a reserva de liquidez da plataforma. O saldo do gateway deve sempre cobrir 100% dos saldos dos usuários + margem de segurança.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Editable gateway balance */}
                <div className="flex items-end gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1">Saldo atual do gateway (R$)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground font-semibold">R$</span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={gatewayBalanceInput}
                        onChange={(e) => setGatewayBalanceInput(e.target.value)}
                        onBlur={(e) => setGatewayBalanceInput(normalizeCurrencyInput(e.target.value))}
                        placeholder="0,00"
                        className="text-2xl font-bold h-12 max-w-[220px]"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSaveGatewayBalance} disabled={savingBalance} className="h-12">
                    <Save className="h-4 w-4 mr-2" />{savingBalance ? 'Salvando...' : 'Atualizar Saldo'}
                  </Button>
                  <div className="text-right">
                    <Badge className={`text-sm px-3 py-1 ${isCritical ? 'bg-red-500/20 text-red-500 border-red-500/30' : isWarning ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'}`}>
                      {isCritical ? '🔴 Crítico' : isWarning ? '🟡 Atenção' : '🟢 Saudável'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">Cobertura: {coveragePercent.toFixed(0)}%</p>
                  </div>
                </div>

                {/* Confirmation toast */}
                {balanceConfirmed && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 animate-in fade-in">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <p className="text-sm text-emerald-400 font-medium">Saldo atualizado com sucesso!</p>
                  </div>
                )}

                {/* Barra de progresso visual */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>Cobertura do passivo</span>
                    <span>{formatCurrency(gatewayBalance)} / {formatCurrency(requiredBalance)}</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted/50 overflow-hidden relative">
                    <div 
                      className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min((gatewayBalance / requiredBalance) * 100, 100)}%` }}
                    />
                    {/* Marcador de 100% */}
                    <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/30" style={{ left: `${Math.min((totalBalance / requiredBalance) * 100, 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>R$0</span>
                    <span className="text-foreground/50">|← Passivo ({formatCurrency(totalBalance)})</span>
                    <span>Meta: {formatCurrency(requiredBalance)}</span>
                  </div>
                </div>

                {/* Indicadores em grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                    <p className="text-lg font-bold">{formatCurrency(gatewayBalance)}</p>
                    <p className="text-[10px] text-muted-foreground">💰 Caixa</p>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <p className="text-lg font-bold">{formatCurrency(totalBalance)}</p>
                    <p className="text-[10px] text-muted-foreground">👥 Passivo (Usuários)</p>
                  </div>
                  <div className={`p-3 rounded-lg text-center ${isHealthy ? 'bg-emerald-500/5 border border-emerald-500/20' : 'bg-red-500/5 border border-red-500/20'}`}>
                    <p className={`text-lg font-bold ${isHealthy ? 'text-emerald-500' : 'text-red-500'}`}>
                      {gatewayBalance >= totalBalance ? '+' : ''}{formatCurrency(gatewayBalance - totalBalance)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{isHealthy ? '✅ Sobra' : '❌ Déficit'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
                    <p className="text-lg font-bold">{formatCurrency(safetyMargin)}</p>
                    <p className="text-[10px] text-muted-foreground">🛡️ Margem Min.</p>
                  </div>
                </div>

                {/* Por que manter o saldo */}
                <div className="p-4 rounded-lg bg-muted/20 border border-border/50 space-y-3">
                  <p className="font-semibold text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Por que manter o caixa abastecido?</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-muted-foreground"><strong>Saques instantâneos:</strong> Usuários sacam a qualquer momento. Sem saldo, o saque falha e gera desconfiança.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-muted-foreground"><strong>Picos de demanda:</strong> Apostas ganhas geram saques em massa. A margem de R$500 absorve esses picos.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-muted-foreground"><strong>Reputação:</strong> Plataforma que paga rápido retém e atrai mais usuários. Atraso = churn.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-muted-foreground"><strong>Compliance:</strong> Operar com passivo descoberto pode configurar irregularidade financeira.</p>
                    </div>
                  </div>
                </div>

                {/* Botão de depósito */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground">
                      Clique em <strong>"Depositar no Caixa"</strong> para gerar um QR Code PIX e abastecer a reserva. Use como <strong>livro-caixa</strong> da operação.
                    </p>
                  </div>
                  <Button onClick={() => { setShowAdminDeposit(true); setAdminPixData(null); setAdminDepAmount(deficit > 0 ? Math.ceil(deficit).toString() : ''); setAdminDepCpf(''); }}>
                    <Plus className="h-4 w-4 mr-2" /> Depositar no Caixa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        );
      })()}

      <Card className="border-border/60 bg-card/70">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpRight className="h-5 w-5" /> Central Operacional de Saques
          </CardTitle>
          <CardDescription>
            Área para retirada administrativa, transferência interna e reforço da mensagem de confiança para o usuário final.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Retirada do caixa</p>
                  <p className="text-xs text-muted-foreground">
                    Autorize saques administrativos sem comprometer a liquidez prometida aos usuários.
                  </p>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30">Dinheiro seguro</Badge>
              </div>

              <div className="space-y-2">
                <Label>Valor do saque</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={adminWithdrawalAmount}
                  onChange={(e) => setAdminWithdrawalAmount(e.target.value.replace(/[^0-9,.]/g, ''))}
                  onBlur={(e) => setAdminWithdrawalAmount(normalizeCurrencyInput(e.target.value))}
                  placeholder="0,00"
                />
                <p className="text-[11px] text-muted-foreground">
                  Faixa segura disponível agora: <strong>{formatCurrency(safeOperationalWithdrawal)}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Destino operacional</Label>
                <Input
                  value={adminWithdrawalTarget}
                  onChange={(e) => setAdminWithdrawalTarget(e.target.value)}
                  placeholder="Conta bancária operacional"
                />
              </div>

              <div className="space-y-2">
                <Label>Observação interna</Label>
                <Input
                  value={adminWithdrawalMemo}
                  onChange={(e) => setAdminWithdrawalMemo(e.target.value)}
                  placeholder="Liquidação manual de caixa"
                />
              </div>

              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-muted-foreground">
                O usuário pode ver a mensagem de confiança: <strong>“Seu dinheiro está seguro e coberto pela reserva operacional.”</strong>
              </div>

              <Button onClick={handleAdminWithdrawalPreview} className="w-full">
                <ArrowUpRight className="mr-2 h-4 w-4" /> Autorizar saque interno
              </Button>
            </div>

            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Transferência interna</p>
                  <p className="text-xs text-muted-foreground">
                    Mova saldo entre reservas, contas operacionais e trilhas internas de liquidação.
                  </p>
                </div>
                <Badge variant="outline">Liquidação interna</Badge>
              </div>

              <div className="space-y-2">
                <Label>Valor da transferência</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={adminTransferAmount}
                  onChange={(e) => setAdminTransferAmount(e.target.value.replace(/[^0-9,.]/g, ''))}
                  onBlur={(e) => setAdminTransferAmount(normalizeCurrencyInput(e.target.value))}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label>Rota interna</Label>
                <Input
                  value={adminTransferTarget}
                  onChange={(e) => setAdminTransferTarget(e.target.value)}
                  placeholder="Reserva interna → Conta operacional"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/50 bg-background/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Saldo do gateway</p>
                  <p className="text-sm font-semibold">{formatCurrency(gatewayBalance)}</p>
                </div>
                <div className="rounded-lg border border-border/50 bg-background/60 p-3">
                  <p className="text-[11px] text-muted-foreground">Reserva mínima</p>
                  <p className="text-sm font-semibold">{formatCurrency(requiredGatewayReserve)}</p>
                </div>
              </div>

              <Button variant="outline" onClick={handleInternalTransferPreview} className="w-full">
                <RefreshCw className="mr-2 h-4 w-4" /> Registrar transferência
              </Button>
            </div>

            <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div>
                <p className="text-sm font-semibold">Confiança e abastecimento</p>
                <p className="text-xs text-muted-foreground">
                  Deixe claro no gateway que os valores estão protegidos e que o sistema pede reforço antes de qualquer risco operacional.
                </p>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Mensagem sugerida ao usuário</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      “Seu dinheiro está seguro. Transferências e saques passam por uma reserva interna protegida antes da liberação final.”
                    </p>
                  </div>
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${gatewayTopUpNeeded > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-emerald-500/30 bg-emerald-500/5'}`}>
                <div className="flex items-start gap-3">
                  {gatewayTopUpNeeded > 0 ? <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" />}
                  <div>
                    <p className="text-sm font-semibold">
                      {gatewayTopUpNeeded > 0 ? 'Peça abastecimento antes de liberar novas saídas' : 'Reserva pronta para atender saques'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {gatewayTopUpNeeded > 0
                        ? `O painel deve pedir aporte de ${formatCurrency(gatewayTopUpNeeded)} para manter a liquidez protegida.`
                        : 'A operação está coberta e pode comunicar estabilidade financeira ao usuário.'}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowAdminDeposit(true);
                  setAdminPixData(null);
                  setAdminDepAmount(gatewayTopUpNeeded > 0 ? Math.ceil(gatewayTopUpNeeded).toString() : '500');
                  setAdminDepCpf('');
                }}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" /> Pedir abastecimento do caixa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview - 4 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Saldo Disponível</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalBalance)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Saldo total dos usuários</p>
              </div>
              <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Recebido Hoje</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(todayTotal)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Total faturado no dia</p>
              </div>
              <div className="h-11 w-11 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Bloqueio / Pendentes</p>
                <p className="text-2xl font-bold mt-1">{pendingDeposits.length}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Depósitos aguardando</p>
              </div>
              <div className="h-11 w-11 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Lock className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Faturamento Total</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalDeposited)}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Valor total de depósitos</p>
              </div>
              <div className="h-11 w-11 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="deposits" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="deposits" className="text-xs">📋 Depósitos</TabsTrigger>
          <TabsTrigger value="users" className="text-xs">👥 Usuários</TabsTrigger>
          <TabsTrigger value="limits" className="text-xs">⚙️ Limites</TabsTrigger>
          <TabsTrigger value="credentials" className="text-xs">🔑 Credenciais</TabsTrigger>
          <TabsTrigger value="webhook" className="text-xs">🔗 Webhook</TabsTrigger>
        </TabsList>

        {/* Deposits Tab - with user name */}
        <TabsContent value="deposits">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-5 w-5" /> Histórico de Depósitos PIX
                  </CardTitle>
                  <CardDescription>Todos os depósitos com identificação do usuário</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchDeposits} disabled={loadingDeposits}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${loadingDeposits ? 'animate-spin' : ''}`} /> Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <p className="text-lg font-bold text-emerald-500">{confirmedDeposits.length}</p>
                  <p className="text-[11px] text-muted-foreground">Confirmados</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                  <p className="text-lg font-bold text-amber-500">{pendingDeposits.length}</p>
                  <p className="text-[11px] text-muted-foreground">Pendentes</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/20 text-center">
                  <p className="text-lg font-bold text-blue-400">{formatCurrency(totalGatewayFunding)}</p>
                  <p className="text-[11px] text-muted-foreground">Aportes no caixa</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 text-center">
                  <p className="text-lg font-bold text-muted-foreground">{expiredDeposits.length}</p>
                  <p className="text-[11px] text-muted-foreground">Expirados</p>
                </div>
              </div>

              <ScrollArea className="h-[420px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Usuário</TableHead>
                      <TableHead className="text-xs">Finalidade</TableHead>
                      <TableHead className="text-xs">Valor</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">ID Externo</TableHead>
                      <TableHead className="text-xs">Data</TableHead>
                      <TableHead className="text-xs">Pago em</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deposits.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <CreditCard className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          Nenhum depósito registrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      deposits.map((dep) => (
                        <TableRow key={dep.id}>
                          <TableCell className="font-medium text-xs">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {(userNameMap.get(dep.user_id) || '?')[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate max-w-[120px]">{userNameMap.get(dep.user_id) || dep.user_id.slice(0, 8)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{depositTargetBadge(dep)}</TableCell>
                          <TableCell className="font-semibold text-xs">{formatCurrency(dep.amount)}</TableCell>
                          <TableCell>{statusBadge(dep.status)}</TableCell>
                          <TableCell className="text-[10px] text-muted-foreground font-mono">{dep.external_id.slice(0, 16)}...</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">{formatDate(dep.created_at)}</TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">{dep.paid_at ? formatDate(dep.paid_at) : '—'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users / Wallets Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5" /> Saldos dos Usuários
                  </CardTitle>
                  <CardDescription>Visão geral financeira de cada usuário da plataforma</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchUserWallets} disabled={loadingWallets}>
                  <RefreshCw className={`h-4 w-4 mr-1 ${loadingWallets ? 'animate-spin' : ''}`} /> Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[480px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Usuário</TableHead>
                      <TableHead className="text-xs text-right">Saldo Atual</TableHead>
                      <TableHead className="text-xs text-right">Depositado</TableHead>
                      <TableHead className="text-xs text-right">Sacado</TableHead>
                      <TableHead className="text-xs text-right">Ganhos</TableHead>
                      <TableHead className="text-xs text-right">Perdas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userWallets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                          Nenhum usuário encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      userWallets.map((uw) => (
                        <TableRow key={uw.user_id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={uw.avatar_url || undefined} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {(uw.full_name || '?')[0]?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-xs font-medium">{uw.full_name || 'Sem nome'}</p>
                                <p className="text-[10px] text-muted-foreground">{uw.user_id.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-xs">{formatCurrency(uw.balance)}</TableCell>
                          <TableCell className="text-right text-xs text-emerald-500">{formatCurrency(uw.total_deposited)}</TableCell>
                          <TableCell className="text-right text-xs text-red-400">{formatCurrency(uw.total_withdrawn)}</TableCell>
                          <TableCell className="text-right text-xs text-emerald-400">{formatCurrency(uw.total_won)}</TableCell>
                          <TableCell className="text-right text-xs text-red-400">{formatCurrency(uw.total_lost)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Limits Tab */}
        <TabsContent value="limits">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="h-5 w-5" /> Limites de Depósito
              </CardTitle>
              <CardDescription>Defina os valores mínimo e máximo que os usuários podem depositar via PIX</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
                    Depósito Mínimo (R$)
                  </Label>
                  <Input
                    type="number"
                    value={minDeposit}
                    onChange={(e) => setMinDeposit(e.target.value)}
                    placeholder="5"
                    min={1}
                  />
                  <p className="text-[11px] text-muted-foreground">Valor atual: {formatCurrency(currentMinDeposit)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                    Depósito Máximo (R$)
                  </Label>
                  <Input
                    type="number"
                    value={maxDeposit}
                    onChange={(e) => setMaxDeposit(e.target.value)}
                    placeholder="10000"
                    min={1}
                  />
                  <p className="text-[11px] text-muted-foreground">Valor atual: {formatCurrency(currentMaxDeposit)}</p>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm font-medium mb-1">Resumo</p>
                <p className="text-xs text-muted-foreground">
                  Depósitos serão aceitos entre {formatCurrency(Number(minDeposit) || 0)} e {formatCurrency(Number(maxDeposit) || 0)}.
                  Alterações se aplicam imediatamente para novos depósitos.
                </p>
              </div>

              <Button onClick={handleSaveLimits} disabled={savingLimits} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {savingLimits ? 'Salvando...' : 'Salvar Limites'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Key className="h-5 w-5" /> Credenciais do Gateway</CardTitle>
              <CardDescription>Credenciais criptografadas do sistema de pagamento integrado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Client ID</Label>
                <div className="flex gap-2">
                  <Input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="Insira o Client ID" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(clientId)}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Client Secret</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input type={showSecret ? 'text' : 'password'} value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} placeholder="Insira o Client Secret" />
                    <Button variant="ghost" size="icon" className="absolute right-0 top-0 h-full" onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {gatewayConfig?.client_secret_encrypted && !clientSecret && (
                  <p className="text-xs text-muted-foreground">• Secret já configurado. Deixe em branco para manter o atual.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>URL Base da API</Label>
                <Input value={apiEndpoint} onChange={(e) => setApiEndpoint(e.target.value)} placeholder="https://api.gateway.internal/v2" />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Ativar Gateway</p>
                    <p className="text-xs text-muted-foreground">Habilita depósitos e saques via PIX</p>
                  </div>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook Tab */}
        <TabsContent value="webhook">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Webhook className="h-5 w-5" /> Webhook</CardTitle>
              <CardDescription>URL para receber notificações de pagamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>URL do Webhook</Label>
                <div className="flex gap-2">
                  <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://seu-dominio.com/api/webhook" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(webhookUrl)}><Copy className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>

      {/* Admin Deposit Modal */}
      <Dialog open={showAdminDeposit} onOpenChange={setShowAdminDeposit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              Depositar no Caixa do Gateway
            </DialogTitle>
          </DialogHeader>

          {!adminPixData ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <p className="text-xs text-muted-foreground">
                  <strong>Controle de caixa:</strong> Este depósito abastece o saldo do gateway para cobrir saques dos usuários. 
                  Recomenda-se manter sempre R$500 acima do total de saldos dos usuários.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Valor do depósito (R$)</Label>
                <Input
                  type="text"
                  value={adminDepAmount}
                  onChange={(e) => setAdminDepAmount(e.target.value.replace(/[^0-9,.]/g, ''))}
                  onBlur={(e) => setAdminDepAmount(normalizeCurrencyInput(e.target.value))}
                  placeholder="0,00"
                  className="text-lg font-semibold"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map(v => (
                  <Button key={v} variant="outline" size="sm" onClick={() => setAdminDepAmount(v.toString())}>
                    {formatCurrency(v)}
                  </Button>
                ))}
              </div>
              <div className="space-y-2">
                <Label>CPF do administrador</Label>
                <Input
                  type="text"
                  value={adminDepCpf}
                  onChange={(e) => setAdminDepCpf(formatCpfInput(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <Button onClick={handleAdminDeposit} disabled={adminDepLoading || !adminDepAmount} className="w-full">
                {adminDepLoading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <QrCode className="h-4 w-4 mr-2" />}
                {adminDepLoading ? 'Gerando...' : 'Gerar QR Code PIX'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{formatCurrency(adminPixData.amount)}</p>
                <p className="text-xs text-muted-foreground mt-1">Pague para abastecer o caixa</p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  {statusBadge(adminPixStatus || 'pending')}
                  <span className="text-[11px] text-muted-foreground">O saldo entra no painel após a confirmação do PIX.</span>
                </div>
              </div>
              {getAdminQrSrc() ? (
                <div className="flex justify-center">
                  <div className="bg-white p-4 rounded-xl">
                    <img src={getAdminQrSrc()} alt="QR Code PIX" className="w-48 h-48" />
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                  QR Code visual indisponível no momento, mas o código PIX abaixo continua válido.
                </div>
              )}
              {adminPixData.qr_code && (
                <div className="space-y-2">
                  <Label className="text-xs">PIX Copia e Cola</Label>
                  <div className="flex gap-2">
                    <Input value={adminPixData.qr_code} readOnly className="text-xs font-mono" />
                    <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(adminPixData.qr_code); toast({ title: 'Copiado!' }); }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={() => void checkAdminPixPaymentStatus(true)} disabled={checkingAdminPix || adminPixStatus === 'confirmed'} className="w-full">
                  {checkingAdminPix ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                  {adminPixStatus === 'confirmed' ? 'Pagamento confirmado' : 'Verificar pagamento'}
                </Button>
                <Button variant="outline" onClick={() => { adminPixConfirmedRef.current = false; setAdminPixStatus(null); setAdminPixData(null); setShowAdminDeposit(false); }} className="w-full">
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}