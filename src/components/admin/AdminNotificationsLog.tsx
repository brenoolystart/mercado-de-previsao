import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, RefreshCw, Trophy, Gift, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reference_id: string | null;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  bet_won: { label: 'Vitória', color: 'text-green-500' },
  bet_lost: { label: 'Derrota', color: 'text-destructive' },
  trade_bonus: { label: 'Bônus Trade', color: 'text-amber-500' },
  referral_bonus: { label: 'Bônus Indicação', color: 'text-blue-500' },
  admin_deposit: { label: 'Depósito', color: 'text-green-500' },
  admin_withdrawal: { label: 'Saque', color: 'text-amber-500' },
  admin_signup: { label: 'Novo Usuário', color: 'text-primary' },
  post_like: { label: 'Curtida', color: 'text-pink-500' },
  post_comment: { label: 'Comentário', color: 'text-blue-500' },
};

export function AdminNotificationsLog() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    // Note: admin can only see their own notifications due to RLS
    // This shows admin-targeted notifications (deposits, withdrawals, signups)

    const { data } = await query;
    setNotifications((data || []) as NotificationRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = typeFilter === 'all'
    ? notifications
    : notifications.filter(n => n.type === typeFilter);

  const typeCounts = notifications.reduce((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Log de Notificações
          </h2>
          <p className="text-sm text-muted-foreground">Histórico de notificações do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filtrar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({notifications.length})</SelectItem>
              {Object.entries(typeCounts).map(([type, count]) => (
                <SelectItem key={type} value={type}>
                  {TYPE_LABELS[type]?.label || type} ({count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold">{notifications.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Resoluções</span>
            </div>
            <p className="text-xl font-bold text-green-500">
              {(typeCounts['bet_won'] || 0) + (typeCounts['bet_lost'] || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Bônus</span>
            </div>
            <p className="text-xl font-bold">
              {(typeCounts['trade_bonus'] || 0) + (typeCounts['referral_bonus'] || 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Admin</span>
            </div>
            <p className="text-xl font-bold">
              {(typeCounts['admin_deposit'] || 0) + (typeCounts['admin_withdrawal'] || 0) + (typeCounts['admin_signup'] || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Lido</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhuma notificação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filtered.slice(0, 50).map(n => {
                  const typeInfo = TYPE_LABELS[n.type] || { label: n.type, color: 'text-muted-foreground' };
                  return (
                    <TableRow key={n.id}>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${typeInfo.color}`}>
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{n.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {n.message}
                      </TableCell>
                      <TableCell>
                        {n.is_read ? (
                          <span className="text-xs text-green-500">✓</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(n.created_at), 'dd/MM HH:mm')}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
