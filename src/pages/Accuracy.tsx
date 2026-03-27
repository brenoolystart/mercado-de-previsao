import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Target, TrendingUp, TrendingDown, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Accuracy = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { user } = useAuthContext();
  const [stats, setStats] = useState({ total: 0, won: 0, lost: 0, pending: 0, accuracy: 0, profit: 0 });
  const [loading, setLoading] = useState(true);
  const [recentBets, setRecentBets] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    async function load() {
      const { data: bets } = await supabase.from('bets').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50);
      if (!bets) { setLoading(false); return; }

      const total = bets.length;
      const won = bets.filter(b => b.status === 'won').length;
      const lost = bets.filter(b => b.status === 'lost').length;
      const pending = bets.filter(b => b.status === 'pending').length;
      const profit = bets.reduce((acc, b) => {
        if (b.status === 'won') return acc + (b.payout_amount || 0) - b.amount;
        if (b.status === 'lost') return acc - b.amount;
        return acc;
      }, 0);
      const resolved = won + lost;
      setStats({ total, won, lost, pending, accuracy: resolved > 0 ? (won / resolved) * 100 : 0, profit });
      setRecentBets(bets.filter(b => b.status !== 'pending').slice(0, 10));
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Precisão</h1>
        </div>

        {!user ? (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground mb-4">Faça login para ver sua precisão.</p>
            <Button onClick={() => window.location.href = '/login'}>Entrar</Button>
          </div>
        ) : loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-card border border-border rounded-2xl p-5 text-center">
                <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{stats.accuracy.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Precisão</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-primary" />
                <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Palpites</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p className="text-3xl font-bold text-green-500">{stats.won}</p>
                <p className="text-sm text-muted-foreground">Acertos</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5 text-center">
                <TrendingDown className="w-8 h-8 mx-auto mb-2 text-red-500" />
                <p className="text-3xl font-bold text-red-500">{stats.lost}</p>
                <p className="text-sm text-muted-foreground">Erros</p>
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Lucro / Prejuízo</p>
              <p className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.profit >= 0 ? '+' : ''}R$ {stats.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {recentBets.length > 0 && (
              <>
                <h2 className="font-semibold text-foreground mb-3">Palpites Resolvidos Recentes</h2>
                <div className="space-y-2">
                  {recentBets.map(b => (
                    <div key={b.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
                      {b.status === 'won' ? <TrendingUp className="w-5 h-5 text-green-500 shrink-0" /> : <TrendingDown className="w-5 h-5 text-red-500 shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{b.market_title}</p>
                        <p className="text-xs text-muted-foreground">{b.position.toUpperCase()} @ {(b.price_at_bet * 100).toFixed(0)}¢</p>
                      </div>
                      <p className={`text-sm font-bold ${b.status === 'won' ? 'text-green-500' : 'text-red-500'}`}>
                        {b.status === 'won' ? '+' : '-'}R$ {b.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
      <Footer />
      <MobileHotbar />
    </div>
  );
};

export default Accuracy;
