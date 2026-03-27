import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, TrendingUp, DollarSign, Activity, ArrowUpRight, ArrowDownRight, 
  Clock, CheckCircle2, RefreshCw, BarChart3, Eye, AlertTriangle,
  Wallet, Target, Zap, PiggyBank, Percent, TrendingDown, ShieldCheck, Trash2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RecentActivity {
  id: string;
  type: 'bet' | 'deposit' | 'withdrawal' | 'signup';
  description: string;
  amount?: number;
  created_at: string;
  user_name?: string;
}

interface ContractProfit {
  market_title: string;
  market_id: string;
  total_bet: number;
  total_lost_by_users: number;
  total_paid_out: number;
  profit: number;
  bets_count: number;
}

interface TopUser {
  user_id: string;
  full_name: string;
  total_bet: number;
  total_lost: number;
  total_won: number;
  net_result: number; // positive = user won, negative = platform earned
}

export function AdminDashboard() {
  const { stats, refreshStats } = useAdmin();
  const { toast } = useToast();
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [dailyVolume, setDailyVolume] = useState<{ date: string; volume: number; bets: number; profit: number }[]>([]);
  const [betStatusData, setBetStatusData] = useState<{ name: string; value: number }[]>([]);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [contractProfits, setContractProfits] = useState<ContractProfit[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);
  const [realtimeProfit, setRealtimeProfit] = useState(0);
  const [userBalancesTotal, setUserBalancesTotal] = useState(0);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  const handleCleanupFakeBets = async () => {
    if (!confirm('Tem certeza? Isto cancelará todos os palpites de usuários sem depósito real via PIX e zerará seus saldos.')) return;
    setIsCleaningUp(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: 'Erro', description: 'Sessão expirada', variant: 'destructive' }); return; }

      const response = await supabase.functions.invoke('admin-cleanup-fake-bets', {});

      if (response.error) {
        toast({ title: 'Erro', description: 'Falha na limpeza', variant: 'destructive' });
      } else {
        const result = response.data;
        toast({ 
          title: '✅ Limpeza concluída', 
          description: `${result.cancelledBets} palpites cancelados, ${result.walletsReset} carteiras zeradas, ${result.affectedUsers} usuários afetados.` 
        });
        refreshAll();
      }
    } catch (err) {
      toast({ title: 'Erro', description: 'Erro ao executar limpeza', variant: 'destructive' });
    }
    setIsCleaningUp(false);
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  useEffect(() => {
    fetchRecentActivity();
    fetchDailyVolume();
    fetchContractProfits();
    fetchTopUsers();
    fetchUserBalances();
    setOnlineUsers(Math.floor(Math.random() * 50) + 5);
  }, []);

  useEffect(() => {
    if (stats) {
      setBetStatusData([
        { name: 'Pendentes', value: stats.pendingBets },
        { name: 'Resolvidas', value: stats.resolvedBets },
        { name: 'Ativas', value: stats.activeBets },
      ]);
      setRealtimeProfit(stats.platformProfit || 0);
    }
  }, [stats]);

  // Realtime subscription for bets
  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime-bets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bets' }, () => {
        refreshStats();
        fetchContractProfits();
        fetchDailyVolume();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wallets' }, () => {
        fetchUserBalances();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => {
        fetchRecentActivity();
        refreshStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchUserBalances = async () => {
    const { data } = await supabase.from('wallets').select('balance');
    if (data) {
      setUserBalancesTotal(data.reduce((s, w) => s + Number(w.balance), 0));
    }
  };

  const fetchContractProfits = async () => {
    setLoadingContracts(true);
    try {
      const { data: bets } = await supabase
        .from('bets')
        .select('market_id, market_title, amount, status, payout_amount');

      if (bets) {
        const marketMap = new Map<string, ContractProfit & { pending_count: number; pending_volume: number }>();
        
        bets.forEach(bet => {
          const existing = marketMap.get(bet.market_id) || {
            market_title: bet.market_title,
            market_id: bet.market_id,
            total_bet: 0,
            total_lost_by_users: 0,
            total_paid_out: 0,
            profit: 0,
            bets_count: 0,
            pending_count: 0,
            pending_volume: 0,
          };

          existing.total_bet += Number(bet.amount);
          existing.bets_count += 1;

          if (bet.status === 'lost') {
            existing.total_lost_by_users += Number(bet.amount);
          } else if (bet.status === 'won') {
            existing.total_paid_out += Number(bet.payout_amount || 0);
          } else if (bet.status === 'pending') {
            existing.pending_count += 1;
            existing.pending_volume += Number(bet.amount);
          }

          // Only count resolved profit
          const resolvedBet = existing.total_bet - existing.pending_volume;
          const wonBetsAmount = resolvedBet - existing.total_lost_by_users;
          existing.profit = existing.total_lost_by_users - (existing.total_paid_out - wonBetsAmount);
          marketMap.set(bet.market_id, existing);
        });

        const sorted = Array.from(marketMap.values()).sort((a, b) => b.profit - a.profit);
        setContractProfits(sorted);
      }
    } catch (err) {
      console.error('Error fetching contract profits:', err);
    }
    setLoadingContracts(false);
  };

  const fetchTopUsers = async () => {
    try {
      const { data: bets } = await supabase
        .from('bets')
        .select('user_id, amount, status, payout_amount')
        .in('status', ['won', 'lost']);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      if (bets && profiles) {
        const profileMap = new Map(profiles.map(p => [p.user_id, p.full_name || 'Anônimo']));
        const userMap = new Map<string, TopUser>();

        bets.forEach(bet => {
          const existing = userMap.get(bet.user_id) || {
            user_id: bet.user_id,
            full_name: profileMap.get(bet.user_id) || 'Anônimo',
            total_bet: 0,
            total_lost: 0,
            total_won: 0,
            net_result: 0,
          };

          existing.total_bet += Number(bet.amount);
          if (bet.status === 'lost') {
            existing.total_lost += Number(bet.amount);
          } else if (bet.status === 'won') {
            existing.total_won += Number(bet.payout_amount || 0);
          }

          existing.net_result = existing.total_won - existing.total_bet;
          userMap.set(bet.user_id, existing);
        });

        const sorted = Array.from(userMap.values()).sort((a, b) => a.net_result - b.net_result);
        setTopUsers(sorted.slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching top users:', err);
    }
  };

  const fetchRecentActivity = async () => {
    setLoadingActivity(true);
    try {
      const { data: bets } = await supabase
        .from('bets')
        .select('id, amount, market_title, status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('id, amount, type, description, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities: RecentActivity[] = [];

      bets?.forEach(b => activities.push({
        id: b.id, type: 'bet',
        description: `Palpite em "${b.market_title}"`,
        amount: Number(b.amount), created_at: b.created_at,
      }));

      transactions?.forEach(t => activities.push({
        id: t.id, type: t.type === 'deposit' ? 'deposit' : 'withdrawal',
        description: t.description || t.type,
        amount: Number(t.amount), created_at: t.created_at,
      }));

      profiles?.forEach(p => activities.push({
        id: p.user_id, type: 'signup',
        description: `Novo usuário: ${p.full_name || 'Anônimo'}`,
        created_at: p.created_at, user_name: p.full_name || undefined,
      }));

      activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentActivity(activities.slice(0, 10));
    } catch (err) {
      console.error('Error fetching recent activity:', err);
    }
    setLoadingActivity(false);
  };

  const fetchDailyVolume = async () => {
    try {
      const days = 7;
      const volumeData: { date: string; volume: number; bets: number; profit: number }[] = [];
      
      for (let i = days - 1; i >= 0; i--) {
        const day = subDays(new Date(), i);
        const dayStart = startOfDay(day).toISOString();
        const dayEnd = startOfDay(subDays(new Date(), i - 1)).toISOString();
        
        const { data: dayBets } = await supabase
          .from('bets')
          .select('amount, status, payout_amount')
          .gte('created_at', dayStart)
          .lt('created_at', dayEnd);

        const vol = dayBets?.reduce((s, b) => s + Number(b.amount), 0) || 0;
        const lostByUsers = dayBets?.filter(b => b.status === 'lost').reduce((s, b) => s + Number(b.amount), 0) || 0;
        const paidOut = dayBets?.filter(b => b.status === 'won').reduce((s, b) => s + Number(b.payout_amount || 0), 0) || 0;
        const wonBetsAmount = dayBets?.filter(b => b.status === 'won').reduce((s, b) => s + Number(b.amount), 0) || 0;

        volumeData.push({
          date: format(day, 'dd/MM', { locale: ptBR }),
          volume: vol,
          bets: dayBets?.length || 0,
          profit: lostByUsers - (paidOut - wonBetsAmount),
        });
      }
      setDailyVolume(volumeData);
    } catch (err) {
      console.error('Error fetching daily volume:', err);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)'];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bet': return <Target className="h-4 w-4 text-primary" />;
      case 'deposit': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'withdrawal': return <ArrowDownRight className="h-4 w-4 text-orange-500" />;
      case 'signup': return <Users className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const refreshAll = () => {
    refreshStats();
    fetchRecentActivity();
    fetchDailyVolume();
    fetchContractProfits();
    fetchTopUsers();
    fetchUserBalances();
  };

  const statCards = [
    { title: 'Usuários', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { title: 'Palpites', value: stats?.totalBets || 0, icon: Activity, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
    { title: 'Volume Total', value: formatCurrency(stats?.totalVolume || 0), icon: TrendingUp, color: 'text-green-500', bgColor: 'bg-green-500/10', isValue: true },
    { title: 'Depósitos', value: formatCurrency(stats?.totalDeposits || 0), icon: ArrowUpRight, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10', isValue: true },
    { title: 'Saques', value: formatCurrency(stats?.totalWithdrawals || 0), icon: ArrowDownRight, color: 'text-orange-500', bgColor: 'bg-orange-500/10', isValue: true },
    { title: 'Lucro Plataforma', value: formatCurrency(stats?.platformProfit || 0), icon: DollarSign, color: (stats?.platformProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500', bgColor: (stats?.platformProfit || 0) >= 0 ? 'bg-green-500/10' : 'bg-red-500/10', isValue: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Métricas e estatísticas da plataforma em tempo real</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-500">{onlineUsers} online</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <RefreshCw className="h-3 w-3 mr-1" />Realtime
          </Badge>
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="h-4 w-4 mr-2" />Atualizar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleCleanupFakeBets} disabled={isCleaningUp}>
            <Trash2 className="h-4 w-4 mr-2" />{isCleaningUp ? 'Limpando...' : 'Limpar Palpites Falsos'}
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{stat.title}</p>
              <p className={`text-lg font-bold mt-0.5 ${stat.isValue ? stat.color : 'text-foreground'}`}>
                {stat.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 💰 Financial Health Panel */}
      <Card className="border-border/50 border-2 border-green-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-green-500" />
            Saúde Financeira — Tempo Real
          </CardTitle>
          <CardDescription>Valores reais baseados nos palpites resolvidos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Total Palpitado</p>
              <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(stats?.totalVolume || 0)}</p>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-[10px] uppercase tracking-wider text-red-400 font-medium">Perdido por Usuários</p>
              <p className="text-lg font-bold text-red-500 mt-1">{formatCurrency(stats?.totalLost || 0)}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-[10px] uppercase tracking-wider text-blue-400 font-medium">Pago aos Vencedores</p>
              <p className="text-lg font-bold text-blue-500 mt-1">{formatCurrency(stats?.totalWon || 0)}</p>
            </div>
            <div className={`p-3 rounded-xl ${(stats?.platformProfit || 0) >= 0 ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {(stats?.platformProfit || 0) >= 0 ? '✅ LUCRO DA CASA' : '❌ PREJUÍZO DA CASA'}
              </p>
              <p className={`text-xl font-bold mt-1 ${(stats?.platformProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(stats?.platformProfit || 0)}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="text-[10px] uppercase tracking-wider text-purple-400 font-medium">House Edge</p>
              <p className="text-lg font-bold text-purple-500 mt-1">{(stats?.houseEdge || 0).toFixed(2)}%</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-[10px] uppercase tracking-wider text-amber-400 font-medium">Saldo Total Usuários</p>
              <p className="text-lg font-bold text-amber-500 mt-1">{formatCurrency(userBalancesTotal)}</p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium text-foreground">Fórmula do Lucro:</span> Perdas dos Usuários − (Pagamentos − Palpites dos Vencedores). 
                Palpites pendentes não são contabilizados no lucro final. Dados atualizados em tempo real via WebSocket.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📊 Contratos Ativos / Pendentes */}
      <Card className="border-border/50 border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Contratos Ativos — Exposição em Tempo Real
            <div className="ml-auto flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-primary font-medium">LIVE</span>
            </div>
          </CardTitle>
          <CardDescription>Palpites pendentes ainda não resolvidos — mostra quanto a plataforma está exposta</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <p className="text-[10px] uppercase tracking-wider text-primary font-medium">Contratos Pendentes</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stats?.pendingBets || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 border border-border">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Volume Pendente</p>
              <p className="text-lg font-bold text-foreground mt-1">{formatCurrency(stats?.pendingVolume || 0)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Dinheiro em jogo</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-[10px] uppercase tracking-wider text-amber-400 font-medium">Exposição Máxima</p>
              <p className="text-lg font-bold text-amber-500 mt-1">{formatCurrency(stats?.pendingExposure || 0)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Payouts − Volume coletado</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
              <p className="text-[10px] uppercase tracking-wider text-green-400 font-medium">Lucro Estimado Pendente</p>
              <p className="text-lg font-bold text-green-500 mt-1">{formatCurrency(stats?.pendingExpectedProfit || 0)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Baseado no house edge atual</p>
            </div>
          </div>
          
          {(stats?.pendingExposure || 0) > (stats?.platformProfit || 0) && (stats?.pendingBets || 0) > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-200">
                <span className="font-bold">Atenção:</span> A exposição pendente ({formatCurrency(stats?.pendingExposure || 0)}) excede o lucro acumulado. 
                Se todos os pendentes ganharem, a plataforma teria prejuízo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Volume + Profit Chart */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Volume & Lucro — Últimos 7 Dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }} 
                  formatter={(value: number, name: string) => [formatCurrency(value), name === 'volume' ? 'Volume' : 'Lucro']}
                />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Volume" />
                <Bar dataKey="profit" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Lucro" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bet Status Pie */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Status dos Palpites</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={betStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {betStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {betStatusData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contract Profits Table */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Lucro por Contrato/Mercado
          </CardTitle>
          <CardDescription>Quanto a plataforma ganhou ou perdeu em cada mercado resolvido</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingContracts ? (
            <div className="flex justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : contractProfits.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhum mercado resolvido ainda</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                 <thead>
                   <tr className="border-b border-border text-left">
                     <th className="py-2 px-3 text-xs text-muted-foreground font-medium">Mercado</th>
                     <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Palpites</th>
                     <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Pendentes</th>
                     <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Total Palpitado</th>
                     <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Perdido Usuários</th>
                     <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Pago</th>
                     <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Lucro Casa</th>
                   </tr>
                 </thead>
                 <tbody>
                   {contractProfits.slice(0, 20).map((cp: any) => (
                     <tr key={cp.market_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                       <td className="py-2.5 px-3 max-w-[250px] truncate text-foreground font-medium">{cp.market_title}</td>
                       <td className="py-2.5 px-3 text-right text-muted-foreground">{cp.bets_count}</td>
                       <td className="py-2.5 px-3 text-right">
                         {cp.pending_count > 0 ? (
                           <span className="inline-flex items-center gap-1 text-primary">
                             <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                             {cp.pending_count} ({formatCurrency(cp.pending_volume)})
                           </span>
                         ) : (
                           <span className="text-muted-foreground">—</span>
                         )}
                       </td>
                       <td className="py-2.5 px-3 text-right text-muted-foreground">{formatCurrency(cp.total_bet)}</td>
                       <td className="py-2.5 px-3 text-right text-red-500">{formatCurrency(cp.total_lost_by_users)}</td>
                       <td className="py-2.5 px-3 text-right text-blue-500">{formatCurrency(cp.total_paid_out)}</td>
                       <td className={`py-2.5 px-3 text-right font-bold ${cp.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                         {formatCurrency(cp.profit)}
                       </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Users (by loss = platform revenue) */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Ranking de Usuários — Impacto Financeiro
          </CardTitle>
          <CardDescription>Usuários que mais geraram receita (perderam) ou mais ganharam da plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          {topUsers.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">Nenhum dado disponível</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 px-3 text-xs text-muted-foreground font-medium">Usuário</th>
                    <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Total Palpitado</th>
                    <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Perdeu</th>
                    <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Ganhou</th>
                    <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Resultado</th>
                    <th className="py-2 px-3 text-xs text-muted-foreground font-medium text-right">Para a Casa</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.map((u) => (
                    <tr key={u.user_id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 px-3 text-foreground font-medium">{u.full_name}</td>
                      <td className="py-2.5 px-3 text-right text-muted-foreground">{formatCurrency(u.total_bet)}</td>
                      <td className="py-2.5 px-3 text-right text-red-500">{formatCurrency(u.total_lost)}</td>
                      <td className="py-2.5 px-3 text-right text-green-500">{formatCurrency(u.total_won)}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${u.net_result >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {u.net_result >= 0 ? '+' : ''}{formatCurrency(u.net_result)}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${u.net_result < 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatCurrency(-u.net_result)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingActivity ? (
              <div className="flex justify-center py-8"><RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">Nenhuma atividade recente</p>
            ) : (
              <div className="space-y-2">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="p-1.5 rounded-full bg-muted">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {activity.amount && (
                      <span className={`text-sm font-medium ${activity.type === 'withdrawal' ? 'text-orange-500' : 'text-green-500'}`}>
                        {activity.type === 'withdrawal' ? '-' : '+'}{formatCurrency(activity.amount)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Status do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { name: 'Banco de Dados', status: 'Online', color: 'bg-green-500' },
                { name: 'Autenticação', status: 'Online', color: 'bg-green-500' },
                { name: 'Storage', status: 'Online', color: 'bg-green-500' },
                { name: 'Gateway Pagamento', status: 'Não configurado', color: 'bg-amber-500' },
                { name: 'Edge Functions', status: 'Online', color: 'bg-green-500' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-2.5 w-2.5 rounded-full ${item.color} ${item.status === 'Online' ? 'animate-pulse' : ''}`} />
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.status}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Alertas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(stats?.pendingBets || 0) > 0 && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{stats?.pendingBets} palpites pendentes</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Palpites aguardando resolução</p>
                  </div>
                </div>
              )}
              {userBalancesTotal > (stats?.totalDeposits || 0) - (stats?.totalWithdrawals || 0) && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Passivo alto</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Saldo total de usuários ({formatCurrency(userBalancesTotal)}) acima do esperado</p>
                  </div>
                </div>
              )}
              {(stats?.pendingBets || 0) === 0 && userBalancesTotal <= ((stats?.totalDeposits || 0) - (stats?.totalWithdrawals || 0)) && (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <p className="text-sm">Tudo em ordem! Nenhum alerta.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
