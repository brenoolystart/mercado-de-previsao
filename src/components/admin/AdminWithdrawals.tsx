import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, CheckCircle, XCircle, Clock, DollarSign, ArrowDownLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  pix_key: string;
  pix_key_type: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
  user_name?: string;
}

export function AdminWithdrawals() {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processDialog, setProcessDialog] = useState(false);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const fetchWithdrawals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pix_withdrawals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      const userIds = [...new Set(data.map(w => w.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      setWithdrawals(data.map(w => ({
        ...w,
        amount: Number(w.amount),
        user_name: nameMap.get(w.user_id) || undefined,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchWithdrawals(); }, []);

  const handleProcess = async () => {
    if (!selected) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('process-withdrawal', {
        body: { withdrawalId: selected.id, action, adminNotes: adminNotes.trim() || undefined },
      });
      if (error || data?.error) {
        toast({ title: data?.error || 'Erro ao processar', variant: 'destructive' });
      } else {
        toast({ title: action === 'approve' ? 'Saque aprovado!' : 'Saque rejeitado e valor devolvido!' });
        fetchWithdrawals();
      }
    } catch {
      toast({ title: 'Erro ao processar', variant: 'destructive' });
    }
    setProcessing(false);
    setProcessDialog(false);
    setAdminNotes('');
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendente', variant: 'secondary' },
      approved: { label: 'Aprovado', variant: 'default' },
      rejected: { label: 'Rejeitado', variant: 'destructive' },
    };
    const c = map[status] || map.pending;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const pending = withdrawals.filter(w => w.status === 'pending');
  const totalPending = pending.reduce((s, w) => s + w.amount, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Clock className="h-4 w-4 text-amber-500" /><span className="text-xs text-muted-foreground">Pendentes</span></div><p className="text-xl font-bold text-amber-500">{pending.length}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total Pendente</span></div><p className="text-lg font-bold">{formatCurrency(totalPending)}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><ArrowDownLeft className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">Total Saques</span></div><p className="text-xl font-bold">{withdrawals.length}</p></CardContent></Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div><CardTitle>Solicitações de Saque</CardTitle><CardDescription>{withdrawals.length} saques</CardDescription></div>
            <Button variant="outline" size="sm" onClick={fetchWithdrawals}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Chave PIX</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8"><RefreshCw className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : withdrawals.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum saque</TableCell></TableRow>
                ) : (
                  withdrawals.map(w => (
                    <TableRow key={w.id}>
                      <TableCell className="text-sm">{w.user_name || w.user_id.slice(0, 8)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(w.amount)}</TableCell>
                      <TableCell className="text-sm font-mono">{w.pix_key}</TableCell>
                      <TableCell className="text-sm">{w.pix_key_type}</TableCell>
                      <TableCell>{statusBadge(w.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{format(new Date(w.created_at), 'dd/MM HH:mm')}</TableCell>
                      <TableCell className="text-right">
                        {w.status === 'pending' && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="default" onClick={() => { setSelected(w); setAction('approve'); setProcessDialog(true); }}>
                              <CheckCircle className="h-3.5 w-3.5 mr-1" />Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { setSelected(w); setAction('reject'); setProcessDialog(true); }}>
                              <XCircle className="h-3.5 w-3.5 mr-1" />Rejeitar
                            </Button>
                          </div>
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

      <Dialog open={processDialog} onOpenChange={setProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === 'approve' ? 'Aprovar Saque' : 'Rejeitar Saque'}</DialogTitle>
            <DialogDescription>
              {selected?.user_name || 'Usuário'} — {formatCurrency(selected?.amount || 0)} via {selected?.pix_key_type}: {selected?.pix_key}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Observações (opcional)"
              value={adminNotes}
              onChange={e => setAdminNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialog(false)}>Cancelar</Button>
            <Button
              variant={action === 'approve' ? 'default' : 'destructive'}
              onClick={handleProcess}
              disabled={processing}
            >
              {processing ? 'Processando...' : action === 'approve' ? 'Confirmar Aprovação' : 'Confirmar Rejeição'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
