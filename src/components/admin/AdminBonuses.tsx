import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Gift, Plus, RefreshCw, Copy, Trash2, Percent, DollarSign, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PromoBonus {
  id: string;
  code: string;
  description: string | null;
  amount: number;
  percentage: number | null;
  max_uses: number;
  used_count: number;
  min_deposit: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export function AdminBonuses() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [bonuses, setBonuses] = useState<PromoBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [percentage, setPercentage] = useState('');
  const [maxUses, setMaxUses] = useState('100');
  const [minDeposit, setMinDeposit] = useState('0');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchBonuses = async () => {
    setLoading(true);
    const { data } = await supabase.from('promo_bonuses').select('*').order('created_at', { ascending: false });
    setBonuses((data as PromoBonus[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBonuses(); }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)];
    setCode(result);
  };

  const handleCreate = async () => {
    if (!code.trim()) { toast({ title: 'Informe o código', variant: 'destructive' }); return; }
    if (!amount && !percentage) { toast({ title: 'Defina valor fixo ou percentual', variant: 'destructive' }); return; }

    setCreating(true);
    const { error } = await supabase.from('promo_bonuses').insert({
      code: code.trim().toUpperCase(),
      description: description.trim() || null,
      amount: Number(amount) || 0,
      percentage: percentage ? Number(percentage) : null,
      max_uses: Number(maxUses) || 100,
      min_deposit: Number(minDeposit) || 0,
      created_by: user!.id,
      expires_at: expiresAt || null,
    });
    if (error) {
      toast({ title: error.message.includes('duplicate') ? 'Código já existe' : 'Erro ao criar bônus', variant: 'destructive' });
    } else {
      toast({ title: 'Bônus criado com sucesso!' });
      setCode(''); setDescription(''); setAmount(''); setPercentage('');
      setMaxUses('100'); setMinDeposit('0'); setExpiresAt('');
      setCreateOpen(false);
      fetchBonuses();
    }
    setCreating(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from('promo_bonuses').update({ is_active: !current }).eq('id', id);
    fetchBonuses();
  };

  const deleteBonus = async (id: string) => {
    await supabase.from('promo_bonuses').delete().eq('id', id);
    toast({ title: 'Bônus removido' });
    fetchBonuses();
  };

  const copyCode = (c: string) => { navigator.clipboard.writeText(c); toast({ title: `Código ${c} copiado!` }); };

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const totalActive = bonuses.filter(b => b.is_active).length;
  const totalRedemptions = bonuses.reduce((s, b) => s + b.used_count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Gift className="h-5 w-5 text-primary" />Bônus Promocionais</h2>
          <p className="text-sm text-muted-foreground">Gerencie cupons e promoções para os usuários</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBonuses}><RefreshCw className="h-4 w-4 mr-1" />Atualizar</Button>
          <Button size="sm" onClick={() => { generateCode(); setCreateOpen(true); }}><Plus className="h-4 w-4 mr-1" />Novo Bônus</Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Gift className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Total</span></div><p className="text-xl font-bold">{bonuses.length}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-green-500" /><span className="text-xs text-muted-foreground">Ativos</span></div><p className="text-xl font-bold text-green-500">{totalActive}</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-blue-500" /><span className="text-xs text-muted-foreground">Resgates</span></div><p className="text-xl font-bold">{totalRedemptions}</p></CardContent></Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expira</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8"><RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
              ) : bonuses.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum bônus criado</TableCell></TableRow>
              ) : (
                bonuses.map(b => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold text-sm">{b.code}</code>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(b.code)}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {b.amount > 0 && <span className="font-medium">{formatCurrency(b.amount)}</span>}
                        {b.percentage && <Badge variant="secondary" className="ml-1 text-xs"><Percent className="h-3 w-3 mr-0.5" />{b.percentage}%</Badge>}
                      </div>
                      {b.min_deposit > 0 && <p className="text-[10px] text-muted-foreground">Min: {formatCurrency(b.min_deposit)}</p>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{b.used_count}/{b.max_uses}</span>
                    </TableCell>
                    <TableCell>
                      <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b.id, b.is_active)} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.expires_at ? format(new Date(b.expires_at), 'dd/MM/yy') : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteBonus(b.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Bônus Promocional</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Código</Label>
              <div className="flex gap-2">
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="EX: BONUS50" className="font-mono" />
                <Button variant="outline" onClick={generateCode} type="button">Gerar</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Bônus de boas-vindas" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Valor Fixo (R$)</Label>
                <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Percentual (%)</Label>
                <Input type="number" min="0" max="100" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Máx. de usos</Label>
                <Input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Depósito mínimo (R$)</Label>
                <Input type="number" min="0" step="0.01" value={minDeposit} onChange={e => setMinDeposit(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expira em (opcional)</Label>
              <Input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>{creating ? 'Criando...' : 'Criar Bônus'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
