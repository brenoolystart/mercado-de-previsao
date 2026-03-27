import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, RefreshCw, Filter, ArrowUpRight, ArrowDownRight, 
  DollarSign, Download, Wallet, Activity, TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  type: string;
  description: string | null;
  reference_id: string | null;
  created_at: string;
  user_name?: string;
}

export function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const fetchTransactions = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);

    if (data) {
      const userIds = [...new Set(data.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setTransactions(data.map(t => ({
        ...t,
        amount: Number(t.amount),
        balance_after: Number(t.balance_after),
        user_name: nameMap.get(t.user_id) || undefined,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, []);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.includes(searchTerm);
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: string) => {
    const map: Record<string, { label: string; color: string; icon: any }> = {
      deposit: { label: 'Depósito', color: 'bg-green-500 text-white', icon: ArrowUpRight },
      withdrawal: { label: 'Saque', color: 'bg-orange-500 text-white', icon: ArrowDownRight },
      bet_placed: { label: 'Aposta', color: 'bg-purple-500 text-white', icon: Activity },
      bet_win: { label: 'Ganho', color: 'bg-emerald-500 text-white', icon: TrendingUp },
      bet_refund: { label: 'Devolução', color: 'bg-blue-500 text-white', icon: RefreshCw },
      admin_credit: { label: 'Crédito Admin', color: 'bg-primary text-primary-foreground', icon: DollarSign },
      admin_debit: { label: 'Débito Admin', color: 'bg-destructive text-destructive-foreground', icon: DollarSign },
    };
    const config = map[type] || { label: type, color: '', icon: Activity };
    return <Badge className={`gap-1 ${config.color}`}>{config.label}</Badge>;
  };

  const stats = {
    total: transactions.length,
    deposits: transactions.filter(t => t.type === 'deposit').reduce((s, t) => s + Math.abs(t.amount), 0),
    withdrawals: transactions.filter(t => t.type === 'withdrawal').reduce((s, t) => s + Math.abs(t.amount), 0),
    volume: transactions.reduce((s, t) => s + Math.abs(t.amount), 0),
  };

  const exportTransactions = () => {
    const csv = ['Tipo,Descrição,Valor,Saldo Após,Usuário,Data', ...filteredTransactions.map(t =>
      `"${t.type}","${t.description || ''}","${t.amount}","${t.balance_after}","${t.user_name || t.user_id.slice(0, 8)}","${t.created_at}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transacoes_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
  };

  const uniqueTypes = [...new Set(transactions.map(t => t.type))];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Activity className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total</span></div><p className="text-xl font-bold">{stats.total}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><ArrowUpRight className="h-4 w-4 text-green-500" /><span className="text-xs text-muted-foreground">Depósitos</span></div><p className="text-lg font-bold text-green-500">{formatCurrency(stats.deposits)}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><ArrowDownRight className="h-4 w-4 text-orange-500" /><span className="text-xs text-muted-foreground">Saques</span></div><p className="text-lg font-bold text-orange-500">{formatCurrency(stats.withdrawals)}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-blue-500" /><span className="text-xs text-muted-foreground">Volume</span></div><p className="text-lg font-bold">{formatCurrency(stats.volume)}</p></CardContent></Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div><CardTitle>Transações</CardTitle><CardDescription>{filteredTransactions.length} transações</CardDescription></div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportTransactions}><Download className="h-4 w-4 mr-1" />CSV</Button>
              <Button variant="outline" size="sm" onClick={fetchTransactions}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar descrição, usuário..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-1" /><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Saldo Após</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8"><RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
                ) : filteredTransactions.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada</TableCell></TableRow>
                ) : (
                  filteredTransactions.map(txn => (
                    <TableRow key={txn.id}>
                      <TableCell>
                        <div>
                          <p className="text-sm">{format(new Date(txn.created_at), 'dd/MM/yy', { locale: ptBR })}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(txn.created_at), 'HH:mm')}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(txn.type)}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">{txn.description || '-'}</TableCell>
                      <TableCell className="text-sm">{txn.user_name || txn.user_id.slice(0, 8)}</TableCell>
                      <TableCell className={`font-medium ${txn.amount >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatCurrency(txn.balance_after)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
