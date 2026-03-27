import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/hooks/useAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, RefreshCw, Filter, Target, CheckCircle, XCircle, 
  Clock, DollarSign, TrendingUp, AlertTriangle, Download,
  MoreHorizontal, Eye
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Bet {
  id: string;
  user_id: string;
  market_id: string;
  market_title: string;
  position: string;
  amount: number;
  potential_payout: number;
  price_at_bet: number;
  status: string;
  payout_amount: number | null;
  created_at: string;
  resolved_at: string | null;
  wallet_id: string;
  user_name?: string;
}

export function AdminBets() {
  const { logAction } = useAdmin();
  const { toast } = useToast();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [resolveDialog, setResolveDialog] = useState(false);
  const [resolveOutcome, setResolveOutcome] = useState<'won' | 'lost'>('won');
  const [resolveMarketDialog, setResolveMarketDialog] = useState(false);
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [selectedMarketTitle, setSelectedMarketTitle] = useState('');
  const [winningPosition, setWinningPosition] = useState<'yes' | 'no'>('yes');
  const [resolving, setResolving] = useState(false);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const fetchBets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('bets')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (data) {
      // Fetch user names
      const userIds = [...new Set(data.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setBets(data.map(b => ({ ...b, amount: Number(b.amount), potential_payout: Number(b.potential_payout), price_at_bet: Number(b.price_at_bet), payout_amount: b.payout_amount ? Number(b.payout_amount) : null, user_name: nameMap.get(b.user_id) || undefined })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchBets(); }, []);

  const filteredBets = bets.filter(bet => {
    const matchesSearch = bet.market_title.toLowerCase().includes(searchTerm.toLowerCase()) || bet.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || bet.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || bet.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleResolve = async () => {
    if (!selectedBet) return;

    const payoutAmount = resolveOutcome === 'won' ? selectedBet.potential_payout : 0;

    const { error } = await supabase
      .from('bets')
      .update({ 
        status: resolveOutcome, 
        payout_amount: payoutAmount,
        resolved_at: new Date().toISOString()
      })
      .eq('id', selectedBet.id);

    if (error) {
      toast({ title: 'Erro ao resolver palpite', variant: 'destructive' });
    } else {
      if (resolveOutcome === 'won') {
        // Credit wallet
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id, balance, total_won')
          .eq('user_id', selectedBet.user_id)
          .single();

        if (wallet) {
          await supabase.from('wallets').update({
            balance: Number(wallet.balance) + payoutAmount,
            total_won: Number(wallet.total_won) + payoutAmount,
          }).eq('id', wallet.id);

          await supabase.from('transactions').insert({
            user_id: selectedBet.user_id,
            wallet_id: wallet.id,
            amount: payoutAmount,
            balance_after: Number(wallet.balance) + payoutAmount,
            type: 'bet_win',
            description: `Ganhou palpite: ${selectedBet.market_title}`,
            reference_id: selectedBet.id,
          });
        }
      }

      await logAction('resolve_bet', 'bets', selectedBet.id, { status: 'pending' }, { status: resolveOutcome, payout_amount: payoutAmount });
      toast({ title: `Palpite ${resolveOutcome === 'won' ? 'marcado como acerto' : 'marcado como erro'}!` });
      fetchBets();
    }
    setResolveDialog(false);
  };

  const handleResolveMarket = async () => {
    if (!selectedMarketId) return;
    setResolving(true);
    try {
      const { data, error } = await supabase.functions.invoke('resolve-market', {
        body: { marketId: selectedMarketId, winningPosition },
      });
      if (error || data?.error) {
        toast({ title: data?.error || 'Erro ao resolver mercado', variant: 'destructive' });
      } else {
        toast({ title: `Mercado resolvido! ${data.wonCount} ganhou, ${data.lostCount} perdeu.` });
        fetchBets();
      }
    } catch {
      toast({ title: 'Erro ao resolver mercado', variant: 'destructive' });
    }
    setResolving(false);
    setResolveMarketDialog(false);
  };

  const handleCancelBet = async (bet: Bet) => {
    // Refund via edge function would be better, but admin has update permission
    await supabase.from('bets').update({ status: 'cancelled', resolved_at: new Date().toISOString() }).eq('id', bet.id);
    await logAction('cancel_bet', 'bets', bet.id, { status: bet.status }, { status: 'cancelled' });
    toast({ title: 'Palpite cancelado!' });
    fetchBets();
  };

  // Get unique markets with pending bets
  const pendingMarkets = [...new Map(
    bets.filter(b => b.status === 'pending').map(b => [b.market_id, { id: b.market_id, title: b.market_title, count: bets.filter(x => x.market_id === b.market_id && x.status === 'pending').length }])
  ).values()];

  const getStatusBadge = (status: string) => {
    const map: Record<string, { icon: any; label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { icon: Clock, label: 'Pendente', variant: 'secondary' },
      won: { icon: CheckCircle, label: 'Ganhou', variant: 'default' },
      lost: { icon: XCircle, label: 'Perdeu', variant: 'destructive' },
      cancelled: { icon: AlertTriangle, label: 'Cancelada', variant: 'outline' },
    };
    const config = map[status] || map.pending;
    const Icon = config.icon;
    return <Badge variant={config.variant} className="gap-1"><Icon className="h-3 w-3" />{config.label}</Badge>;
  };

  const stats = {
    total: bets.length,
    pending: bets.filter(b => b.status === 'pending').length,
    totalVolume: bets.reduce((s, b) => s + b.amount, 0),
    totalPayout: bets.filter(b => b.status === 'won').reduce((s, b) => s + (b.payout_amount || 0), 0),
  };

  const exportBets = () => {
    const csv = ['Mercado,Posição,Valor,Payout,Status,Data', ...filteredBets.map(b =>
      `"${b.market_title}","${b.position}","${b.amount}","${b.potential_payout}","${b.status}","${b.created_at}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `palpites_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Target className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total</span></div><p className="text-xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-amber-500" /><span className="text-xs text-muted-foreground">Pendentes</span></div><p className="text-xl font-bold text-amber-500">{stats.pending}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-green-500" /><span className="text-xs text-muted-foreground">Volume</span></div><p className="text-lg font-bold">{formatCurrency(stats.totalVolume)}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-blue-500" /><span className="text-xs text-muted-foreground">Retornos</span></div><p className="text-lg font-bold">{formatCurrency(stats.totalPayout)}</p></CardContent></Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle>Gestão de Palpites</CardTitle><CardDescription>{filteredBets.length} palpites</CardDescription></div>
            <div className="flex gap-2">
              {pendingMarkets.length > 0 && (
                <Select onValueChange={(marketId) => {
                  const m = pendingMarkets.find(x => x.id === marketId);
                  if (m) { setSelectedMarketId(m.id); setSelectedMarketTitle(m.title); setResolveMarketDialog(true); }
                }}>
                  <SelectTrigger className="w-[200px]"><Target className="h-4 w-4 mr-1" /><SelectValue placeholder="Resolver Mercado" /></SelectTrigger>
                  <SelectContent>
                    {pendingMarkets.map(m => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title.substring(0, 40)}... ({m.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button variant="outline" size="sm" onClick={exportBets}><Download className="h-4 w-4 mr-1" />CSV</Button>
              <Button variant="outline" size="sm" onClick={fetchBets}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar mercado, usuário..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]"><Filter className="h-4 w-4 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="won">Ganhas</SelectItem>
                <SelectItem value="lost">Perdidas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mercado</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Retorno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8"><RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                 ) : filteredBets.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum palpite encontrado</TableCell></TableRow>
                ) : (
                  filteredBets.map(bet => (
                    <TableRow key={bet.id}>
                      <TableCell className="max-w-[200px]"><p className="text-sm truncate">{bet.market_title}</p></TableCell>
                      <TableCell className="text-sm">{bet.user_name || bet.user_id.slice(0, 8)}</TableCell>
                      <TableCell><Badge variant="outline">{bet.position}</Badge></TableCell>
                      <TableCell className="font-medium">{formatCurrency(bet.amount)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatCurrency(bet.potential_payout)}</TableCell>
                      <TableCell>{getStatusBadge(bet.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(bet.created_at), 'dd/MM HH:mm')}</TableCell>
                      <TableCell className="text-right">
                        {bet.status === 'pending' && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedBet(bet); setResolveOutcome('won'); setResolveDialog(true); }}>
                                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />Marcar como Ganhou
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedBet(bet); setResolveOutcome('lost'); setResolveDialog(true); }}>
                                <XCircle className="h-4 w-4 mr-2 text-destructive" />Marcar como Perdeu
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCancelBet(bet)}>
                                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />Cancelar e Devolver
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resolve Dialog */}
      <Dialog open={resolveDialog} onOpenChange={setResolveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Palpite</DialogTitle>
            <DialogDescription>
              {selectedBet?.market_title} — {selectedBet?.position}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Valor do palpite</p>
              <p className="font-bold">{formatCurrency(selectedBet?.amount || 0)}</p>
            </div>
            <div className={`p-3 rounded-lg ${resolveOutcome === 'won' ? 'bg-green-500/10 border border-green-500/30' : 'bg-destructive/10 border border-destructive/30'}`}>
              <p className="text-sm text-muted-foreground">Resultado</p>
              <p className="font-bold">{resolveOutcome === 'won' ? `Ganhou — Payout: ${formatCurrency(selectedBet?.potential_payout || 0)}` : 'Perdeu — Sem payout'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveDialog(false)}>Cancelar</Button>
            <Button variant={resolveOutcome === 'won' ? 'default' : 'destructive'} onClick={handleResolve}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Market Dialog */}
      <Dialog open={resolveMarketDialog} onOpenChange={setResolveMarketDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Mercado em Massa</DialogTitle>
            <DialogDescription className="line-clamp-2">{selectedMarketTitle}</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Todos os palpites pendentes deste mercado serão resolvidos. Selecione o resultado vencedor:
            </p>
            <div className="flex gap-3">
              <Button
                variant={winningPosition === 'yes' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setWinningPosition('yes')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />SIM venceu
              </Button>
              <Button
                variant={winningPosition === 'no' ? 'destructive' : 'outline'}
                className="flex-1"
                onClick={() => setWinningPosition('no')}
              >
                <XCircle className="h-4 w-4 mr-2" />NÃO venceu
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveMarketDialog(false)}>Cancelar</Button>
            <Button onClick={handleResolveMarket} disabled={resolving}>
              {resolving ? 'Resolvendo...' : 'Resolver Mercado'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
