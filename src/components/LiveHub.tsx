import { useMemo, useState } from 'react';
import { Radio, Clock, TrendingUp, Users, ChevronRight, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MarketCard } from '@/components/MarketCard';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface LiveHubProps {
  markets: any[];
  loading: boolean;
}

export function LiveHub({ markets, loading }: LiveHubProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<'all' | 'ending' | 'hot' | 'new'>('all');

  const liveMarkets = useMemo(() => {
    const now = Date.now();
    // "Live" = markets with end dates within the next 48 hours, or high recent volume
    return markets.filter((m) => {
      if (m.endDate) {
        const endMs = new Date(m.endDate).getTime();
        const hoursLeft = (endMs - now) / (1000 * 60 * 60);
        if (hoursLeft > 0 && hoursLeft <= 48) return true;
      }
      // Also include high-volume markets (actively traded)
      if (m.volume > 2_000_000) return true;
      return false;
    }).sort((a, b) => {
      // Sort by urgency: ending soonest first
      const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity;
      const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity;
      return aEnd - bEnd;
    });
  }, [markets]);

  const filteredMarkets = useMemo(() => {
    const now = Date.now();
    switch (filter) {
      case 'ending':
        return liveMarkets.filter(m => {
          if (!m.endDate) return false;
          const hoursLeft = (new Date(m.endDate).getTime() - now) / (1000 * 60 * 60);
          return hoursLeft > 0 && hoursLeft <= 12;
        });
      case 'hot':
        return [...liveMarkets].sort((a, b) => b.volume - a.volume).slice(0, 20);
      case 'new':
        return [...liveMarkets].sort((a, b) => {
          const aTime = a.endDate ? new Date(a.endDate).getTime() : 0;
          const bTime = b.endDate ? new Date(b.endDate).getTime() : 0;
          return bTime - aTime;
        });
      default:
        return liveMarkets;
    }
  }, [liveMarkets, filter]);

  const filters = [
    { id: 'all' as const, label: 'Todos', icon: Radio, count: liveMarkets.length },
    { id: 'ending' as const, label: 'Encerrando', icon: Clock, count: liveMarkets.filter(m => {
      if (!m.endDate) return false;
      const h = (new Date(m.endDate).getTime() - Date.now()) / 3600000;
      return h > 0 && h <= 12;
    }).length },
    { id: 'hot' as const, label: 'Em Alta', icon: Flame },
    { id: 'new' as const, label: 'Recentes', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="py-12">
        <div className="container space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Radio className="w-6 h-6 text-red-500" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              Mercados ao Vivo
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 animate-pulse">
                LIVE
              </Badge>
            </h2>
            <p className="text-xs text-muted-foreground">
              {liveMarkets.length} mercados acontecendo agora
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {filters.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                  filter === f.id
                    ? 'bg-red-500/10 text-red-500 border border-red-500/30'
                    : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {f.label}
                {f.count !== undefined && (
                  <span className="text-[10px] bg-muted px-1.5 rounded-full">{f.count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Urgency banner for ending soon */}
        {filter === 'all' && filteredMarkets.some(m => {
          if (!m.endDate) return false;
          const h = (new Date(m.endDate).getTime() - Date.now()) / 3600000;
          return h > 0 && h <= 6;
        }) && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-500 font-medium">
              Alguns mercados encerram em menos de 6 horas!
            </p>
          </div>
        )}

        {/* Markets grid */}
        {filteredMarkets.length === 0 ? (
          <div className="text-center py-16">
            <Radio className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">Nenhum mercado ao vivo no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredMarkets.map((market) => {
              const hoursLeft = market.endDate
                ? Math.max(0, (new Date(market.endDate).getTime() - Date.now()) / 3600000)
                : null;

              return (
                <div key={market.id} className="relative">
                  {hoursLeft !== null && hoursLeft <= 6 && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        {hoursLeft < 1
                          ? `${Math.ceil(hoursLeft * 60)}min`
                          : `${Math.ceil(hoursLeft)}h`
                        }
                      </Badge>
                    </div>
                  )}
                  <MarketCard market={market} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
