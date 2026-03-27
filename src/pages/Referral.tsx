import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuthContext } from '@/contexts/AuthContext';
import { useReferral } from '@/hooks/useReferral';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Check, AlertCircle, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const faqItems = [
  { q: 'Como começar?', a: 'Copie seu link de indicação e compartilhe com amigos. Quando eles se cadastrarem, você recebe R$25 + comissões sobre as taxas dos trades deles.' },
  { q: 'Como os ganhos são calculados?', a: 'Você ganha R$25 fixo por cadastro + 30% das taxas de indicações diretas e 10% das taxas de indicações indiretas (amigos dos seus amigos).' },
  { q: 'O que são indicações indiretas?', a: 'Se você indica o João, e o João indica a Maria, você ganha 10% das taxas da Maria automaticamente.' },
  { q: 'Quando recebo os pagamentos?', a: 'O bônus de R$25 é creditado no cadastro. As comissões sobre taxas são creditadas automaticamente a cada trade do indicado.' },
  { q: 'Existe limite de indicações?', a: 'Não! Você pode indicar quantos amigos quiser e ganhar comissões ilimitadas.' },
];

const Referral = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { user } = useAuthContext();
  const { referralCode, referrals, loading, totalEarned, getReferralLink, refetch } = useReferral();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'indicacoes' | 'payouts'>('indicacoes');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [commissionEarnings, setCommissionEarnings] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchCommissions = async () => {
      const { data } = await supabase
        .from('referral_commissions')
        .select('commission_amount')
        .eq('referrer_id', user.id);
      const total = (data || []).reduce((s, c) => s + Number(c.commission_amount), 0);
      setCommissionEarnings(total);
    };
    fetchCommissions();
  }, [user]);

  const handleCopy = () => {
    const link = getReferralLink();
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const convertedCount = referrals.filter(r => r.referrer_bonus_paid).length;
  const totalAllEarnings = totalEarned + commissionEarnings;

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <main className="max-w-[1280px] mx-auto px-4 py-6 pb-24">
        {!user ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground mb-4">Faça login para acessar seu programa de indicação.</p>
            <Button onClick={() => window.location.href = '/login'}>Entrar</Button>
          </div>
        ) : (
          <>
            {/* Title row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Referrals</h1>
                <Zap className="w-6 h-6 text-yellow-500" />
                <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider">Turbinado</span>
              </div>
              {/* Copy link */}
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                <span className="text-xs text-muted-foreground truncate max-w-[220px] font-mono">
                  {getReferralLink()}
                </span>
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              </div>
            </div>

            {/* Polymarket-style description */}
            <p className="text-sm text-muted-foreground mb-6">
              Ganhe <strong className="text-foreground">R$25 por cadastro</strong> + <strong className="text-foreground">30% de todas as taxas</strong> de indicações diretas, e{' '}
              <strong className="text-foreground">10% das taxas</strong> de todas as indicações indiretas.{' '}
              <button onClick={() => setOpenFaq(1)} className="text-primary hover:underline font-medium">Saiba mais</button>
            </p>

            {/* Stats cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs text-muted-foreground mb-1">Sign ups</p>
                <p className="text-3xl font-bold text-foreground">{referrals.length}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs text-muted-foreground mb-1">Traders ativos</p>
                <p className="text-3xl font-bold text-foreground">{convertedCount}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5 border-primary/30">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                  Earnings <span className="text-lg">🪙</span>
                </p>
                <p className="text-3xl font-bold text-green-500">R$ {totalAllEarnings.toFixed(2)}</p>
                <div className="flex gap-2 mt-2 text-[10px] text-muted-foreground">
                  <span>Bônus: R${totalEarned.toFixed(2)}</span>
                  <span>•</span>
                  <span>Comissões: R${commissionEarnings.toFixed(2)}</span>
                </div>
                <div className="mt-2 h-1 rounded-full bg-primary/20">
                  <div
                    className="h-1 rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (totalAllEarnings / 500) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Bottom grid: Tabs + FAQ */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left: Tabs */}
              <div className="lg:col-span-3">
                <div className="flex border-b border-border mb-4">
                  {(['indicacoes', 'payouts'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab
                          ? 'border-foreground text-foreground'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'indicacoes' ? 'Indicações' : 'Payouts'}
                    </button>
                  ))}
                </div>

                {activeTab === 'indicacoes' && (
                  referrals.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <p className="text-sm">Nenhum usuário indicado ainda</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="text-left py-2 px-3 font-medium">Usuário</th>
                            <th className="text-left py-2 px-3 font-medium">Registro</th>
                            <th className="text-right py-2 px-3 font-medium">Ganho</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referrals.map((r) => (
                            <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-3 px-3 text-foreground">Amigo indicado</td>
                              <td className="py-3 px-3 text-muted-foreground">
                                {new Date(r.created_at).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {r.referrer_bonus_paid ? (
                                  <span className="text-green-500 font-semibold">+R$ 25,00</span>
                                ) : (
                                  <span className="text-muted-foreground">Pendente</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {activeTab === 'payouts' && (
                  commissionEarnings === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <p className="text-sm">Nenhum payout de comissão ainda</p>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-xl p-5">
                      <p className="text-sm text-muted-foreground mb-2">Comissões acumuladas</p>
                      <p className="text-2xl font-bold text-green-500">R$ {commissionEarnings.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Creditadas automaticamente na sua carteira</p>
                    </div>
                  )
                )}
              </div>

              {/* Right: FAQ */}
              <div className="lg:col-span-2">
                <h3 className="font-semibold text-foreground mb-3 text-sm">FAQ</h3>
                <div className="border-t border-border">
                  {faqItems.map((item, i) => (
                    <div key={i} className="border-b border-border">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between py-3 text-sm text-foreground hover:text-foreground/80 transition-colors text-left"
                      >
                        <span>{item.q}</span>
                        {openFaq === i ? (
                          <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                      {openFaq === i && (
                        <p className="text-xs text-muted-foreground pb-3 pr-6">{item.a}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
      <MobileHotbar />
    </div>
  );
};

export default Referral;
