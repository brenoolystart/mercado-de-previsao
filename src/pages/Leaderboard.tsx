import { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, TrendingUp, Award, Flame, Calendar, ChevronUp, ChevronDown, Minus, Target } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BetRecord {
  user_id: string;
  status: string;
  amount: number;
  payout_amount: number | null;
  potential_payout: number;
  created_at: string;
}

interface LeaderboardEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  net_profit: number;
  total_wagered: number;
  total_payout: number;
  total_bets: number;
  won: number;
  lost: number;
  win_rate: number;
  roi: number;
  best_streak: number;
  current_streak: number;
}

type TabKey = 'profit' | 'volume' | 'winrate' | 'roi';
type TimeFilter = 'all' | '7d' | '30d';

const Leaderboard = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { user } = useAuthContext();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('profit');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);

      // Fetch all resolved bets
      let query = supabase
        .from('bets')
        .select('user_id, status, amount, payout_amount, potential_payout, created_at')
        .in('status', ['won', 'lost']);

      if (timeFilter === '7d') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        query = query.gte('resolved_at', d.toISOString());
      } else if (timeFilter === '30d') {
        const d = new Date(); d.setDate(d.getDate() - 30);
        query = query.gte('resolved_at', d.toISOString());
      }

      const { data: bets } = await query;
      if (!bets || bets.length === 0) { setLeaders([]); setLoading(false); return; }

      // Group by user
      const userMap = new Map<string, BetRecord[]>();
      bets.forEach(b => {
        const arr = userMap.get(b.user_id) || [];
        arr.push(b as BetRecord);
        userMap.set(b.user_id, arr);
      });

      // Fetch profiles
      const userIds = [...userMap.keys()];
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Calculate stats per user
      const entries: LeaderboardEntry[] = [];
      for (const [userId, userBets] of userMap) {
        const p = profileMap.get(userId);
        const won = userBets.filter(b => b.status === 'won').length;
        const lost = userBets.filter(b => b.status === 'lost').length;
        const totalBets = won + lost;
        const totalWagered = userBets.reduce((s, b) => s + b.amount, 0);
        const totalPayout = userBets.reduce((s, b) => {
          if (b.status === 'won') return s + (b.payout_amount ?? b.potential_payout);
          return s;
        }, 0);
        const netProfit = totalPayout - totalWagered;
        const roi = totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0;

        // Calculate streaks (sort by date ascending)
        const sorted = [...userBets].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        let bestStreak = 0, currentStreak = 0, streak = 0;
        for (const bet of sorted) {
          if (bet.status === 'won') { streak++; bestStreak = Math.max(bestStreak, streak); }
          else { streak = 0; }
        }
        // Current streak from end
        for (let i = sorted.length - 1; i >= 0; i--) {
          if (sorted[i].status === 'won') currentStreak++;
          else break;
        }

        // Only include users with at least 1 resolved bet
        if (totalBets > 0) {
          entries.push({
            user_id: userId,
            full_name: p?.full_name || 'Trader Anônimo',
            avatar_url: p?.avatar_url || null,
            net_profit: netProfit,
            total_wagered: totalWagered,
            total_payout: totalPayout,
            total_bets: totalBets,
            won,
            lost,
            win_rate: (won / totalBets) * 100,
            roi,
            best_streak: bestStreak,
            current_streak: currentStreak,
          });
        }
      }

      setLeaders(entries);
      setLoading(false);
    }
    fetchLeaderboard();
  }, [timeFilter]);

  const sorted = useMemo(() => {
    return [...leaders].sort((a, b) => {
      if (tab === 'profit') return b.net_profit - a.net_profit;
      if (tab === 'volume') return b.total_wagered - a.total_wagered;
      if (tab === 'roi') return b.roi - a.roi;
      return b.win_rate - a.win_rate;
    });
  }, [leaders, tab]);

  const myRank = useMemo(() => {
    if (!user) return null;
    const idx = sorted.findIndex(e => e.user_id === user.id);
    return idx >= 0 ? { rank: idx + 1, entry: sorted[idx] } : null;
  }, [sorted, user]);

  const getRankIcon = (i: number) => {
    if (i === 0) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (i === 1) return <Medal className="w-5 h-5 text-gray-300" />;
    if (i === 2) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>;
  };

  const getStatValue = (entry: LeaderboardEntry) => {
    switch (tab) {
      case 'profit':
        return (
          <div>
            <p className={`font-bold ${entry.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {entry.net_profit >= 0 ? '+' : ''}R$ {entry.net_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[10px] text-muted-foreground">ROI {entry.roi >= 0 ? '+' : ''}{entry.roi.toFixed(1)}%</p>
          </div>
        );
      case 'volume':
        return <p className="font-bold text-foreground">R$ {entry.total_wagered.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>;
      case 'winrate':
        return (
          <div>
            <p className="font-bold text-primary">{entry.win_rate.toFixed(1)}%</p>
            <p className="text-[10px] text-muted-foreground">{entry.won}V / {entry.lost}D</p>
          </div>
        );
      case 'roi':
        return (
          <div>
            <p className={`font-bold ${entry.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {entry.roi >= 0 ? '+' : ''}{entry.roi.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground">{entry.total_bets} palpites</p>
          </div>
        );
    }
  };

  const tabs: { key: TabKey; label: string; icon: typeof Trophy }[] = [
    { key: 'profit', label: 'Lucro', icon: Award },
    { key: 'volume', label: 'Volume', icon: TrendingUp },
    { key: 'winrate', label: 'Taxa de Acerto', icon: Target },
    { key: 'roi', label: 'ROI', icon: Flame },
  ];

  const timeFilters: { key: TimeFilter; label: string }[] = [
    { key: 'all', label: 'Geral' },
    { key: '30d', label: '30 dias' },
    { key: '7d', label: '7 dias' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Classificação</h1>
          </div>
          <div className="flex gap-1 bg-secondary rounded-full p-1">
            {timeFilters.map(tf => (
              <button
                key={tf.key}
                onClick={() => setTimeFilter(tf.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${timeFilter === tf.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-muted'}`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* My Position Banner */}
        {myRank && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-lg font-bold text-primary">#{myRank.rank}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Sua Posição</p>
            <p className="text-xs text-muted-foreground">
                {myRank.entry.won}V / {myRank.entry.lost}D · {myRank.entry.win_rate.toFixed(1)}% taxa de acerto
                {myRank.entry.current_streak > 0 && <> · <Flame className="w-3 h-3 inline text-orange-400" /> {myRank.entry.current_streak} seguidas</>}
              </p>
            </div>
            <div className="text-right">{getStatValue(myRank.entry)}</div>
          </div>
        )}

        {/* Stats Summary */}
        {!loading && sorted.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{sorted.length}</p>
              <p className="text-[10px] text-muted-foreground">Traders</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{leaders.reduce((s, e) => s + e.total_bets, 0)}</p>
              <p className="text-[10px] text-muted-foreground">Palpites Resolvidos</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">R$ {(leaders.reduce((s, e) => s + e.total_wagered, 0) / 1000).toFixed(1)}k</p>
              <p className="text-[10px] text-muted-foreground">Volume Total</p>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhum trader classificado ainda.</p>
            <p className="text-sm mt-1">As posições são calculadas com base em palpites resolvidos.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((entry, i) => {
              const isMe = user?.id === entry.user_id;
              return (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-colors ${
                    isMe ? 'bg-primary/10 border-2 border-primary/40' :
                    i < 3 ? 'bg-primary/5 border border-primary/20' : 'bg-card border border-border'
                  }`}
                >
                  <div className="w-8 flex justify-center shrink-0">{getRankIcon(i)}</div>
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarImage src={entry.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">{(entry.full_name || 'A')[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-foreground truncate">{entry.full_name}</p>
                      {entry.current_streak >= 3 && <Flame className="w-4 h-4 text-orange-400 shrink-0" />}
                      {isMe && <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium shrink-0">Você</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {entry.total_bets} palpites · {entry.won}V/{entry.lost}D
                      {entry.best_streak >= 3 && ` · 🔥 ${entry.best_streak} melhor sequência`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">{getStatValue(entry)}</div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
      <MobileHotbar />
    </div>
  );
};

export default Leaderboard;
