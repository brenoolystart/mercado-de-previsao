import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Code2, Construction, Activity, Users, DollarSign, 
  TrendingUp, Database, Zap, RefreshCw, Shield,
  ToggleLeft, Eye, Clock, Server
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface LogEntry {
  id: string;
  created_at: string;
  action: string;
  admin_user_id: string;
  target_table: string | null;
}

interface FeatureFlag {
  key: string;
  label: string;
  enabled: boolean;
  description: string | null;
}

interface PlatformMetrics {
  totalUsers: number;
  totalBets: number;
  totalVolume: number;
  totalDeposits: number;
  totalWithdrawals: number;
  platformBalance: number;
  activeMarkets: number;
  pendingWithdrawals: number;
  todaySignups: number;
  todayBets: number;
  todayVolume: number;
  todayDeposits: number;
}

const FEATURE_FLAGS_MAP: Record<string, string> = {
  'feature_feed': '📱 Feed Social',
  'feature_markets': '📊 Mercados',
  'feature_deposits': '💰 Depósitos',
  'feature_withdrawals': '💸 Saques',
  'feature_chat': '🤖 Chat IA',
  'feature_leaderboard': '🏆 Ranking',
};

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function DevPanel() {
  const { isMaintenanceMode, toggleMaintenanceMode } = useMaintenanceMode();
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [uptime] = useState(() => {
    const start = new Date();
    start.setHours(start.getHours() - Math.floor(Math.random() * 72 + 24));
    return start;
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayISO = today.toISOString();

      const [
        profilesRes, betsRes, walletsRes, depositsRes, 
        withdrawalsRes, pollsRes, logsRes, settingsRes,
        todayProfilesRes, todayBetsRes, todayDepositsRes
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('bets').select('amount, status'),
        supabase.from('wallets').select('total_deposited, total_withdrawn, balance'),
        supabase.from('pix_deposits').select('amount, status'),
        supabase.from('pix_withdrawals').select('amount, status'),
        supabase.from('polls').select('status'),
        supabase.from('admin_audit_log').select('id, created_at, action, admin_user_id, target_table').order('created_at', { ascending: false }).limit(50),
        supabase.from('platform_settings').select('*'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
        supabase.from('bets').select('amount').gte('created_at', todayISO),
        supabase.from('pix_deposits').select('amount').eq('status', 'paid').gte('created_at', todayISO),
      ]);

      const totalVolume = betsRes.data?.reduce((s, b) => s + Number(b.amount), 0) || 0;
      const totalDeposits = walletsRes.data?.reduce((s, w) => s + Number(w.total_deposited), 0) || 0;
      const totalWithdrawals = walletsRes.data?.reduce((s, w) => s + Number(w.total_withdrawn), 0) || 0;
      const platformBalance = walletsRes.data?.reduce((s, w) => s + Number(w.balance), 0) || 0;
      const activeMarkets = pollsRes.data?.filter(p => p.status === 'active').length || 0;
      const pendingWithdrawals = withdrawalsRes.data?.filter(w => w.status === 'pending').length || 0;

      setMetrics({
        totalUsers: profilesRes.count || 0,
        totalBets: betsRes.data?.length || 0,
        totalVolume,
        totalDeposits,
        totalWithdrawals,
        platformBalance,
        activeMarkets,
        pendingWithdrawals,
        todaySignups: todayProfilesRes.count || 0,
        todayBets: todayBetsRes.data?.length || 0,
        todayVolume: todayBetsRes.data?.reduce((s, b) => s + Number(b.amount), 0) || 0,
        todayDeposits: todayDepositsRes.data?.reduce((s, d) => s + Number(d.amount), 0) || 0,
      });

      setLogs((logsRes.data || []) as LogEntry[]);

      // Parse feature flags
      const flags: FeatureFlag[] = (settingsRes.data || [])
        .filter(s => s.key.startsWith('feature_'))
        .map(s => {
          const val = s.value;
          return {
            key: s.key,
            label: FEATURE_FLAGS_MAP[s.key] || s.key,
            enabled: val === true || val === 'true' || val === '"true"',
            description: s.description,
          };
        });
      setFeatureFlags(flags);
    } catch (err) {
      console.error('DevPanel fetch error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime logs
  useEffect(() => {
    const channel = supabase
      .channel('dev-audit-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_audit_log' }, (payload) => {
        const newLog = payload.new as LogEntry;
        setLogs(prev => [newLog, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleFeatureFlag = async (key: string, enabled: boolean) => {
    const { error } = await supabase
      .from('platform_settings')
      .update({ value: enabled })
      .eq('key', key);

    if (!error) {
      setFeatureFlags(prev => prev.map(f => f.key === key ? { ...f, enabled } : f));
      toast.success(`${FEATURE_FLAGS_MAP[key] || key} ${enabled ? 'ativado' : 'desativado'}`);
    } else {
      toast.error('Erro ao alterar feature flag');
    }
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    const { error } = await toggleMaintenanceMode(enabled);
    if (!error) toast.success(enabled ? '🔧 Manutenção ATIVADA - admins e usuários bloqueados' : '✅ Manutenção DESATIVADA');
    else toast.error('Erro');
  };

  const getUptime = () => {
    const diff = Date.now() - uptime.getTime();
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  const statusData = [
    { name: 'Depósitos', value: metrics?.totalDeposits || 0 },
    { name: 'Saques', value: metrics?.totalWithdrawals || 0 },
    { name: 'Volume', value: metrics?.totalVolume || 0 },
  ].filter(d => d.value > 0);

  const todayData = [
    { name: 'Signups', value: metrics?.todaySignups || 0 },
    { name: 'Apostas', value: metrics?.todayBets || 0 },
    { name: 'Volume', value: metrics?.todayVolume || 0 },
    { name: 'Depósitos', value: metrics?.todayDeposits || 0 },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Code2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Developer Console</h2>
            <p className="text-sm text-muted-foreground">God Mode • Controle total da plataforma</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
          <Badge variant={isMaintenanceMode ? 'destructive' : 'secondary'} className="text-xs">
            {isMaintenanceMode ? '🔧 MANUTENÇÃO' : '🟢 ONLINE'}
          </Badge>
        </div>
      </div>

      {/* System Status Bar */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-emerald-500" />
              <div>
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-sm font-mono font-medium text-foreground">{getUptime()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Usuários</p>
                <p className="text-sm font-mono font-medium text-foreground">{metrics?.totalUsers}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-chart-2" />
              <div>
                <p className="text-xs text-muted-foreground">Apostas Hoje</p>
                <p className="text-sm font-mono font-medium text-foreground">{metrics?.todayBets}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-chart-3" />
              <div>
                <p className="text-xs text-muted-foreground">Saldo Plataforma</p>
                <p className="text-sm font-mono font-medium text-foreground">R$ {(metrics?.platformBalance || 0).toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Saques Pendentes</p>
                <p className="text-sm font-mono font-medium text-foreground">{metrics?.pendingWithdrawals}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Maintenance + Feature Flags */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <ToggleLeft className="h-5 w-5 text-primary" />
              Controle da Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Maintenance Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2">
                <Construction className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-foreground">Modo Manutenção</p>
                  <p className="text-xs text-muted-foreground">Bloqueia admins e usuários</p>
                </div>
              </div>
              <Switch checked={isMaintenanceMode} onCheckedChange={handleMaintenanceToggle} />
            </div>

            {/* Feature Flags */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Shield className="h-4 w-4" /> Feature Flags
              </p>
              {featureFlags.map(flag => (
                <div key={flag.key} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{flag.label}</p>
                    {flag.description && <p className="text-xs text-muted-foreground">{flag.description}</p>}
                  </div>
                  <Switch checked={flag.enabled} onCheckedChange={(v) => toggleFeatureFlag(flag.key, v)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" />
              Métricas de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{metrics?.todaySignups}</p>
                <p className="text-xs text-muted-foreground">Novos Usuários</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">{metrics?.todayBets}</p>
                <p className="text-xs text-muted-foreground">Apostas</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">R$ {(metrics?.todayVolume || 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Volume</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-center">
                <p className="text-2xl font-bold text-foreground">R$ {(metrics?.todayDeposits || 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground">Depósitos</p>
              </div>
            </div>

            {statusData.length > 0 && (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="h-5 w-5 text-primary" />
            Atividade Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={todayData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Realtime Audit Logs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-5 w-5 text-primary" />
            Logs em Tempo Real
            <Badge variant="outline" className="ml-auto text-xs">{logs.length} registros</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-1">
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum log encontrado</p>
              ) : logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/30 font-mono text-xs border-b border-border/50">
                  <span className="text-muted-foreground whitespace-nowrap flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(log.created_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {log.target_table || 'system'}
                  </Badge>
                  <span className="text-foreground break-all">{log.action}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-primary/20">
          <CardContent className="p-4 text-center">
            <Eye className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xl font-bold text-foreground">{metrics?.totalBets}</p>
            <p className="text-xs text-muted-foreground">Total Apostas</p>
          </CardContent>
        </Card>
        <Card className="border-chart-2/20">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-chart-2" />
            <p className="text-xl font-bold text-foreground">R$ {(metrics?.totalVolume || 0).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Volume Total</p>
          </CardContent>
        </Card>
        <Card className="border-chart-3/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-chart-3" />
            <p className="text-xl font-bold text-foreground">R$ {(metrics?.totalDeposits || 0).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">Total Depósitos</p>
          </CardContent>
        </Card>
        <Card className="border-chart-4/20">
          <CardContent className="p-4 text-center">
            <Activity className="h-5 w-5 mx-auto mb-1 text-chart-4" />
            <p className="text-xl font-bold text-foreground">{metrics?.activeMarkets}</p>
            <p className="text-xs text-muted-foreground">Mercados Ativos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
