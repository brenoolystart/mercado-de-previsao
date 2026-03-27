import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Gift, RefreshCw, DollarSign, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_user_id: string | null;
  referral_code: string;
  status: string;
  referrer_bonus_paid: boolean;
  referred_bonus_paid: boolean;
  created_at: string;
  converted_at: string | null;
}

interface ProfileMap {
  [userId: string]: { full_name: string | null; email?: string };
}

export function AdminReferrals() {
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileMap>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    const refs = (data || []) as ReferralRow[];
    setReferrals(refs);

    // Fetch profiles for all user IDs
    const userIds = new Set<string>();
    refs.forEach(r => {
      userIds.add(r.referrer_id);
      if (r.referred_user_id) userIds.add(r.referred_user_id);
    });

    if (userIds.size > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', Array.from(userIds));

      const map: ProfileMap = {};
      (profileData || []).forEach(p => {
        map[p.user_id] = { full_name: p.full_name };
      });
      setProfiles(map);
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const converted = referrals.filter(r => r.referred_user_id);
  const bonusesPaid = referrals.filter(r => r.referrer_bonus_paid).length;
  const totalPaid = bonusesPaid * 25;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Programa de Indicações
          </h2>
          <p className="text-sm text-muted-foreground">Acompanhe indicações, conversões e bônus pagos</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Códigos Ativos</span>
            </div>
            <p className="text-xl font-bold">{referrals.filter(r => !r.referred_user_id).length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Convertidos</span>
            </div>
            <p className="text-xl font-bold text-green-500">{converted.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Bônus Pagos</span>
            </div>
            <p className="text-xl font-bold">{bonusesPaid}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Total Pago</span>
            </div>
            <p className="text-xl font-bold">R$ {totalPaid}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Indicador</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Indicado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bônus</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : converted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhuma indicação convertida ainda
                  </TableCell>
                </TableRow>
              ) : (
                converted.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {profiles[r.referrer_id]?.full_name || r.referrer_id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <code className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">
                        {r.referral_code}
                      </code>
                    </TableCell>
                    <TableCell className="text-sm">
                      {r.referred_user_id
                        ? profiles[r.referred_user_id]?.full_name || r.referred_user_id.slice(0, 8)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'converted' ? 'default' : 'secondary'} className="text-xs">
                        {r.status === 'converted' ? 'Convertido' : r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {r.referrer_bonus_paid ? (
                        <Badge className="bg-green-500/20 text-green-500 text-xs">R$25 ✓</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pendente</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(r.created_at), 'dd/MM/yy')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
