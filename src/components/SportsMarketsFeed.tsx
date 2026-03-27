import type { PredictionMarket } from '@/hooks/useNews';
import { SPORTS_CATALOG, buildSportsSummary, filterMarketsBySport, getSportsMarketPhase, type SportsBoardView } from '@/lib/sports';
import { SportsLeagueSection } from '@/components/SportsLeagueSection';
import { useTranslation } from 'react-i18next';

interface SportsMarketsFeedProps {
  markets: PredictionMarket[];
  activeSport: string;
  view: SportsBoardView;
  selectedMarketId: string | null;
  onSelectMarket: (marketId: string) => void;
}

export function SportsMarketsFeed({ markets, activeSport, view, selectedMarketId, onSelectMarket }: SportsMarketsFeedProps) {
  const { t } = useTranslation();

  const summaries = buildSportsSummary(markets)
    .filter((summary) => summary.active && (activeSport === 'all' || summary.id === activeSport));

  const sections = summaries
    .flatMap((summary) => {
      const sport = SPORTS_CATALOG.find((entry) => entry.id === summary.id)!;
      const sportMarkets = filterMarketsBySport(markets, summary.id).filter((market) => getSportsMarketPhase(market) === view);
      const grouped = new Map<string, PredictionMarket[]>();
      sportMarkets.forEach((market) => {
        const key = market.seriesTitle?.trim() || summary.label;
        grouped.set(key, [...(grouped.get(key) || []), market]);
      });
      return Array.from(grouped.entries()).map(([title, groupMarkets]) => ({
        id: `${summary.id}-${title}`, title, summary, sport,
        markets: groupMarkets.sort((a, b) => b.volume - a.volume),
        totalVolume: groupMarkets.reduce((total, market) => total + market.volume, 0),
      }));
    })
    .sort((a, b) => b.totalVolume - a.totalVolume);

  if (sections.length === 0) {
    return (
      <section className="py-6">
        <div className="rounded-3xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          {t('markets.noSportsMarkets')}
        </div>
      </section>
    );
  }

  return (
    <section className="pt-1 pb-2">
      <div className="space-y-3">
        {sections.map(({ id, title, summary, sport, markets: sectionMarkets }) => (
          <SportsLeagueSection key={id} title={title} summary={summary} sport={sport} markets={sectionMarkets} view={view} selectedMarketId={selectedMarketId} onSelectMarket={onSelectMarket} />
        ))}
      </div>
    </section>
  );
}
