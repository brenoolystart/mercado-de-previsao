import { useState, useEffect } from 'react';
import { MarketCard } from './MarketCard';
import { Skeleton } from '@/components/ui/skeleton';
import type { PredictionMarket } from '@/hooks/useNews';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  Landmark,
  Trophy,
  Bitcoin,
  Globe,
  Cpu,
  Palette,
  BarChart3,
  Heart,
  type LucideIcon
} from 'lucide-react';

interface MarketsGridProps {
  markets: PredictionMarket[];
  loading: boolean;
  error: string | null;
  groupByCategory?: boolean;
}

const BATCH_SIZE = 30;

const categoryIconMap: Record<string, LucideIcon> = {
  finance: BarChart3, tech: Cpu, politics: Landmark, sports: Trophy,
  crypto: Bitcoin, world: Globe, geopolitics: Globe, culture: Palette,
  economy: BarChart3, health: Heart,
};

export function MarketsGrid({ markets, loading, error, groupByCategory = false }: MarketsGridProps) {
  const { t } = useTranslation();
  const scrollRef = useScrollReveal();
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  useEffect(() => { setVisibleCount(BATCH_SIZE); }, [markets.length, groupByCategory]);

  const loadMore = () => setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, markets.length));

  if (loading) {
    return (
      <section className="py-6">
        <h2 className="text-xl font-bold text-foreground mb-4">{t('markets.polls')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4">
              <div className="flex gap-3 mb-3">
                <Skeleton className="w-12 h-12 rounded-lg" />
                <div className="flex-1 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
              </div>
              <div className="space-y-2"><Skeleton className="h-10 w-full rounded" /><Skeleton className="h-10 w-full rounded" /></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (<section className="py-6"><div className="text-center py-12 text-muted-foreground"><p>{error}</p></div></section>);
  }

  const hasMore = visibleCount < markets.length;

  if (groupByCategory && markets.length > 0) {
    const grouped = markets.reduce((acc, market) => {
      const cat = market.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(market);
      return acc;
    }, {} as Record<string, PredictionMarket[]>);

    const allEntries = Object.entries(grouped).filter(([, m]) => m.length > 0);
    const maxLen = Math.max(...allEntries.map(([, m]) => m.length));
    const interleaved: PredictionMarket[] = [];
    for (let i = 0; i < maxLen; i++) {
      for (const [, catMarkets] of allEntries) {
        if (i < catMarkets.length) interleaved.push(catMarkets[i]);
      }
    }

    const visibleMarkets = interleaved.slice(0, visibleCount);
    const hasMoreGrouped = visibleCount < interleaved.length;

    return (
      <section className="py-6 pb-24 md:pb-6">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          {t('markets.trendingPolls')}
          <span className="text-sm font-normal text-muted-foreground ml-1">({interleaved.length})</span>
        </h2>
        <div ref={scrollRef} className="columns-1 sm:columns-2 lg:columns-3 gap-2.5 md:gap-3 [&>*]:mb-2.5 md:[&>*]:mb-3 [&>*]:break-inside-avoid">
          {visibleMarkets.map((market, idx) => (
            <div key={market.id} className="scroll-reveal-item" {...(idx === 0 ? { 'data-tour': 'market-card' } : {})}>
              <MarketCard market={market} />
            </div>
          ))}
        </div>
        {hasMoreGrouped && (
          <div className="flex items-center justify-center py-8">
            <button
              onClick={loadMore}
              className="px-8 py-2.5 text-sm font-semibold text-primary border-2 border-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-200"
            >
              {t('markets.loadingMore', 'Ver mais')} ({interleaved.length - visibleCount})
            </button>
          </div>
        )}
      </section>
    );
  }

  const visibleMarkets = markets.slice(0, visibleCount);

  return (
    <section className="py-6 pb-24 md:pb-6">
      <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
        {t('markets.polls')}
        <span className="text-sm font-normal text-muted-foreground">({markets.length})</span>
      </h2>
      {markets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground"><p>{t('markets.noPolls')}</p></div>
      ) : (
        <>
          <div ref={scrollRef} className="columns-1 sm:columns-2 lg:columns-3 gap-2.5 md:gap-3 [&>*]:mb-2.5 md:[&>*]:mb-3 [&>*]:break-inside-avoid">
            {visibleMarkets.map((market, idx) => (
              <div key={market.id} className="scroll-reveal-item" {...(idx === 0 ? { 'data-tour': 'market-card' } : {})}>
                <MarketCard market={market} />
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex items-center justify-center py-8">
              <button
                onClick={loadMore}
                className="px-8 py-2.5 text-sm font-semibold text-primary border-2 border-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-200"
              >
                {t('markets.loadingMore', 'Ver mais')} ({markets.length - visibleCount})
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
