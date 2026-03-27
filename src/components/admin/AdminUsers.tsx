import { useState } from 'react';
import { useAdmin, AppRole } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, RefreshCw, Shield, User, Eye, Edit, DollarSign, 
  Ban, CheckCircle, AlertTriangle, Download, UserPlus, Filter,
  Wallet, Activity, Calendar, MoreHorizontal, Users, ArrowUpRight, ArrowDownRight,
  ShieldOff, UserX
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function AdminUsers() {
  const { users, isSuperAdmin, updateUserRole, refreshUsers, logAction } = useAdmin();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<(typeof users)[0] | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('user');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState<'add' | 'remove'>('add');
  const [userBets, setUserBets] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || (user.role || 'user') === roleFilter;
    return matchesSearch && matchesRole;
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const getRoleBadge = (role: AppRole | null) => {
    const config: Record<string, { label: string; className: string }> = {
      developer: { label: 'Developer', className: 'bg-emerald-500 text-white' },
      super_admin: { label: 'Super Admin', className: 'bg-primary text-primary-foreground' },
      admin: { label: 'Admin', className: 'bg-blue-500 text-white' },
      moderator: { label: 'Moderador', className: 'bg-amber-500 text-white' },
      user: { label: 'Usuário', className: '' },
    };
    const c = config[role || 'user'] || config['user'];
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const handleEditRole = (user: (typeof users)[0]) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
    setIsRoleDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    const { error } = await updateUserRole(selectedUser.id, newRole);
    if (error) {
      toast({ title: 'Erro ao atualizar', variant: 'destructive' });
    } else {
      await logAction('update_role', 'user_roles', selectedUser.id, { role: selectedUser.role }, { role: newRole });
      toast({ title: 'Role atualizada com sucesso!' });
      refreshUsers();
    }
    setIsRoleDialogOpen(false);
  };

  const handleViewDetails = async (user: (typeof users)[0]) => {
    setSelectedUser(user);
    setIsDetailsDialogOpen(true);

    const { data: bets } = await supabase
      .from('bets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setUserBets(bets || []);

    const { data: txns } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    setUserTransactions(txns || []);
  };

  const handleBalanceDialog = (user: (typeof users)[0]) => {
    setSelectedUser(user);
    setBalanceAmount('');
    setBalanceAction('add');
    setIsBalanceDialogOpen(true);
  };

  const handleBalanceUpdate = async () => {
    if (!selectedUser || !balanceAmount) return;
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' });
      return;
    }

    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', selectedUser.id)
      .single();

    if (!wallet) {
      toast({ title: 'Carteira não encontrada', variant: 'destructive' });
      return;
    }

    const newBalance = balanceAction === 'add' 
      ? Number(wallet.balance) + amount 
      : Math.max(0, Number(wallet.balance) - amount);

    const { error } = await supabase
      .from('wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id);

    if (error) {
      toast({ title: 'Erro ao atualizar saldo', variant: 'destructive' });
    } else {
      // Log transaction
      await supabase.from('transactions').insert({
        user_id: selectedUser.id,
        wallet_id: wallet.id,
        amount: balanceAction === 'add' ? amount : -amount,
        balance_after: newBalance,
        type: balanceAction === 'add' ? 'admin_credit' : 'admin_debit',
        description: `Ajuste admin: ${balanceAction === 'add' ? '+' : '-'}${formatCurrency(amount)}`,
      });
      await logAction('balance_adjustment', 'wallets', selectedUser.id, { balance: wallet.balance }, { balance: newBalance });
      toast({ title: `Saldo ${balanceAction === 'add' ? 'adicionado' : 'removido'} com sucesso!` });
      refreshUsers();
    }
    setIsBalanceDialogOpen(false);
  };

  const exportUsers = () => {
    const csv = [
      'Nome,ID,Role,Saldo,Apostas,Cadastro',
      ...filteredUsers.map(u => 
        `"${u.full_name || ''}","${u.id}","${u.role || 'user'}","${u.wallet_balance}","${u.total_bets}","${u.created_at}"`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    toast({ title: 'Exportação iniciada!' });
  };

  const totalBalance = users.reduce((s, u) => s + u.wallet_balance, 0);
  const adminCount = users.filter(u => u.role && u.role !== 'user').length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Admins</span>
            </div>
            <p className="text-xl font-bold">{adminCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Saldo Total</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(totalBalance)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Apostas Total</span>
            </div>
            <p className="text-xl font-bold">{users.reduce((s, u) => s + u.total_bets, 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>{filteredUsers.length} de {users.length} usuários</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportUsers}>
                <Download className="h-4 w-4 mr-1" />CSV
              </Button>
              <Button variant="outline" size="sm" onClick={refreshUsers}>
                <RefreshCw className="h-4 w-4 mr-1" />Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue placeholder="Filtrar role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderador</SelectItem>
                <SelectItem value="user">Usuário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Apostas</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>{user.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.full_name || 'Sem nome'}</p>
                            <p className="text-xs text-muted-foreground font-mono">{user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(user.wallet_balance)}</TableCell>
                      <TableCell>{user.total_bets}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                              <Eye className="h-4 w-4 mr-2" />Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleBalanceDialog(user)}>
                              <DollarSign className="h-4 w-4 mr-2" />Ajustar saldo
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setBanReason(''); setIsBanDialogOpen(true); }}>
                              <Ban className="h-4 w-4 mr-2 text-destructive" />Banir / Desbanir
                            </DropdownMenuItem>
                            {isSuperAdmin && (
                              <DropdownMenuItem onClick={() => handleEditRole(user)}>
                                <Shield className="h-4 w-4 mr-2" />Alterar role
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Role</DialogTitle>
            <DialogDescription>Alterar role de {selectedUser?.full_name || 'usuário'}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="mb-2 block">Nova Role</Label>
            <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Usuário</SelectItem>
                <SelectItem value="moderator">Moderador</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveRole}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Dialog */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Saldo</DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name} — Saldo atual: {formatCurrency(selectedUser?.wallet_balance || 0)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button variant={balanceAction === 'add' ? 'default' : 'outline'} className="flex-1" onClick={() => setBalanceAction('add')}>
                <ArrowUpRight className="h-4 w-4 mr-1" />Adicionar
              </Button>
              <Button variant={balanceAction === 'remove' ? 'destructive' : 'outline'} className="flex-1" onClick={() => setBalanceAction('remove')}>
                <ArrowDownRight className="h-4 w-4 mr-1" />Remover
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
              <Input type="number" min="0" step="0.01" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="0.00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBalanceDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleBalanceUpdate} variant={balanceAction === 'remove' ? 'destructive' : 'default'}>
              {balanceAction === 'add' ? 'Adicionar' : 'Remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedUser?.avatar_url || undefined} />
                <AvatarFallback>{selectedUser?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedUser?.full_name || 'Sem nome'}</p>
                <p className="text-xs text-muted-foreground font-mono font-normal">{selectedUser?.id}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className="font-bold text-lg">{formatCurrency(selectedUser?.wallet_balance || 0)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Apostas</p>
              <p className="font-bold text-lg">{selectedUser?.total_bets || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-xs text-muted-foreground">Cadastro</p>
              <p className="font-bold text-sm">{selectedUser ? format(new Date(selectedUser.created_at), 'dd/MM/yy') : '-'}</p>
            </div>
          </div>

          <Tabs defaultValue="bets">
            <TabsList className="w-full">
              <TabsTrigger value="bets" className="flex-1">Apostas ({userBets.length})</TabsTrigger>
              <TabsTrigger value="transactions" className="flex-1">Transações ({userTransactions.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="bets">
              {userBets.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">Nenhuma aposta</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {userBets.map(bet => (
                    <div key={bet.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="text-sm font-medium truncate max-w-[300px]">{bet.market_title}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{bet.position}</Badge>
                          <Badge variant={bet.status === 'won' ? 'default' : bet.status === 'lost' ? 'destructive' : 'secondary'} className="text-xs">{bet.status}</Badge>
                        </div>
                      </div>
                      <p className="font-medium text-sm">{formatCurrency(Number(bet.amount))}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="transactions">
              {userTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">Nenhuma transação</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {userTransactions.map(txn => (
                    <div key={txn.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="text-sm">{txn.description || txn.type}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(txn.created_at), "dd/MM/yy HH:mm")}</p>
                      </div>
                      <p className={`font-medium text-sm ${Number(txn.amount) >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {Number(txn.amount) >= 0 ? '+' : ''}{formatCurrency(Number(txn.amount))}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Banir / Desbanir Usuário
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.full_name || 'Usuário'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input value={banReason} onChange={e => setBanReason(e.target.value)} placeholder="Ex: Comportamento abusivo" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBanDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => {
              if (!selectedUser) return;
              const { error } = await supabase.from('profiles').update({
                is_banned: true, banned_at: new Date().toISOString(), ban_reason: banReason || null
              }).eq('user_id', selectedUser.id);
              if (!error) {
                await logAction('ban_user', 'profiles', selectedUser.id, null, { ban_reason: banReason });
                toast({ title: 'Usuário banido!' });
                refreshUsers();
              }
              setIsBanDialogOpen(false);
            }}>
              <Ban className="h-4 w-4 mr-1" />Banir
            </Button>
            <Button variant="outline" onClick={async () => {
              if (!selectedUser) return;
              await supabase.from('profiles').update({
                is_banned: false, banned_at: null, ban_reason: null
              }).eq('user_id', selectedUser.id);
              await logAction('unban_user', 'profiles', selectedUser.id);
              toast({ title: 'Usuário desbanido!' });
              refreshUsers();
              setIsBanDialogOpen(false);
            }}>
              <CheckCircle className="h-4 w-4 mr-1" />Desbanir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
