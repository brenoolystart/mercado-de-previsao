import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { AdminBets } from '@/components/admin/AdminBets';
import { AdminTransactions } from '@/components/admin/AdminTransactions';
import { AdminPolls } from '@/components/admin/AdminPolls';
import { AdminGateway } from '@/components/admin/AdminGateway';
import { AdminSettings } from '@/components/admin/AdminSettings';
import { AdminAuditLog } from '@/components/admin/AdminAuditLog';
import { AdminAnnouncements } from '@/components/admin/AdminAnnouncements';
import { AdminBonuses } from '@/components/admin/AdminBonuses';
import { AdminReferrals } from '@/components/admin/AdminReferrals';
import { AdminNotificationsLog } from '@/components/admin/AdminNotificationsLog';
import { AdminWithdrawals } from '@/components/admin/AdminWithdrawals';
import { AdminInfrastructure } from '@/components/admin/AdminInfrastructure';
import { AdminFinanceiro } from '@/components/admin/AdminFinanceiro';
import { AdminAI } from '@/components/admin/AdminAI';
import { DevPanel } from '@/components/admin/DevPanel';
import { Loader2, Shield, ShieldAlert, ShieldCheck, Code2, Construction } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { userRole, loading: roleLoading, isAdmin, isSuperAdmin, isDeveloper } = useAdmin();
  const { isMaintenanceMode, toggleMaintenanceMode } = useMaintenanceMode();

  useEffect(() => { if (!authLoading && !user) navigate('/login'); }, [authLoading, user, navigate]);
  useEffect(() => { if (!roleLoading && user && !isAdmin) navigate('/'); }, [roleLoading, user, isAdmin, navigate]);

  if (authLoading || roleLoading) return (<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>);
  if (!isAdmin) return (<div className="min-h-screen flex items-center justify-center bg-background"><div className="text-center"><ShieldAlert className="h-16 w-16 text-destructive mx-auto mb-4" /><h1 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h1><p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p></div></div>);

  const getRoleBadge = () => {
    switch (userRole) {
      case 'developer': return (<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-sm font-medium"><Code2 className="h-4 w-4" />Developer</span>);
      case 'super_admin': return (<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-sm font-medium"><ShieldCheck className="h-4 w-4" />Super Admin</span>);
      case 'admin': return (<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-500 text-sm font-medium"><Shield className="h-4 w-4" />Admin</span>);
      case 'moderator': return (<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-500 text-sm font-medium"><Shield className="h-4 w-4" />Moderador</span>);
      default: return null;
    }
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    const { error } = await toggleMaintenanceMode(enabled);
    if (!error) {
      toast.success(enabled ? '🔧 Modo manutenção ATIVADO' : '✅ Modo manutenção DESATIVADO');
    } else {
      toast.error('Erro ao alterar modo manutenção');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground transition-colors">← Voltar</button>
              <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
            </div>
            <div className="flex items-center gap-4">
              {isDeveloper && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 border border-border">
                  <Construction className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Manutenção</span>
                  <Switch
                    checked={isMaintenanceMode}
                    onCheckedChange={handleMaintenanceToggle}
                  />
                </div>
              )}
              {getRoleBadge()}
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1">
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="polls">🗳️ Enquetes</TabsTrigger>
            <TabsTrigger value="bets">🎯 Apostas</TabsTrigger>
            <TabsTrigger value="transactions">💰 Transações</TabsTrigger>
            {(userRole === 'super_admin' || userRole === 'admin' || userRole === 'developer') && (
              <TabsTrigger value="users">👥 Usuários</TabsTrigger>
            )}
            <TabsTrigger value="withdrawals">💸 Saques</TabsTrigger>
            <TabsTrigger value="announcements">📢 Anúncios</TabsTrigger>
            <TabsTrigger value="bonuses">🎁 Bônus</TabsTrigger>
            <TabsTrigger value="referrals">👥 Indicações</TabsTrigger>
            <TabsTrigger value="notif-log">🔔 Notificações</TabsTrigger>
            {isSuperAdmin && (
              <>
                <TabsTrigger value="gateway">💳 Gateway</TabsTrigger>
                <TabsTrigger value="settings">⚙️ Config</TabsTrigger>
              </>
            )}
            <TabsTrigger value="audit">📋 Logs</TabsTrigger>
            {(userRole === 'super_admin' || userRole === 'admin' || userRole === 'developer') && (
              <TabsTrigger value="financeiro">📊 Financeiro</TabsTrigger>
            )}
            {isSuperAdmin && (
              <TabsTrigger value="infra">🖥️ Infra</TabsTrigger>
            )}
            <TabsTrigger value="ai">🤖 IA</TabsTrigger>
            {isDeveloper && (
              <TabsTrigger value="devpanel">🧬 Dev Console</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="dashboard"><AdminDashboard /></TabsContent>
          <TabsContent value="polls"><AdminPolls /></TabsContent>
          <TabsContent value="bets"><AdminBets /></TabsContent>
          <TabsContent value="transactions"><AdminTransactions /></TabsContent>
          {(userRole === 'super_admin' || userRole === 'admin' || userRole === 'developer') && (
            <TabsContent value="users"><AdminUsers /></TabsContent>
          )}
          <TabsContent value="withdrawals"><AdminWithdrawals /></TabsContent>
          <TabsContent value="announcements"><AdminAnnouncements /></TabsContent>
          <TabsContent value="bonuses"><AdminBonuses /></TabsContent>
          <TabsContent value="referrals"><AdminReferrals /></TabsContent>
          <TabsContent value="notif-log"><AdminNotificationsLog /></TabsContent>
          {isSuperAdmin && (
            <>
              <TabsContent value="gateway"><AdminGateway /></TabsContent>
              <TabsContent value="settings"><AdminSettings /></TabsContent>
            </>
          )}
          <TabsContent value="audit"><AdminAuditLog /></TabsContent>
          {(userRole === 'super_admin' || userRole === 'admin' || userRole === 'developer') && (
            <TabsContent value="financeiro"><AdminFinanceiro /></TabsContent>
          )}
          {isSuperAdmin && (
            <TabsContent value="infra"><AdminInfrastructure /></TabsContent>
          )}
          <TabsContent value="ai"><AdminAI /></TabsContent>
          {isDeveloper && (
            <TabsContent value="devpanel"><DevPanel /></TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
}
