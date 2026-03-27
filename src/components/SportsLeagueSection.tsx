import type { PredictionMarket } from '@/hooks/useNews';
import type { SportDefinition, SportSummary, SportsBoardView } from '@/lib/sports';
import { groupSportsMarketsByPhase } from '@/lib/sports';
import { SportsMarketCard } from '@/components/SportsMarketCard';
import { SportsFuturesCard } from '@/components/SportsFuturesCard';

interface SportsLeagueSectionProps {
  title: string;
  summary: SportSummary;
  sport: SportDefinition;
  markets: PredictionMarket[];
  view: SportsBoardView;
  selectedMarketId: string | null;
  onSelectMarket: (marketId: string) => void;
}

function formatCompactVolume(value: number) {
  if (value >= 1_000_000) return `R$${(value / 1_000_000).toFixed(1)}M Vol.`;
  if (value >= 1_000) return `R$${(value / 1_000).toFixed(1)}K Vol.`;
  return `R$${Math.round(value)} Vol.`;
}

export function SportsLeagueSection({
  title,
  sport,
  markets,
  view,
  selectedMarketId,
  onSelectMarket,
}: SportsLeagueSectionProps) {
  const { liveMarkets, futuresMarkets } = groupSportsMarketsByPhase(markets);
  const phaseMarkets = view === 'live' ? liveMarkets : futuresMarkets;

  if (phaseMarkets.length === 0) return null;

  const totalVolume = phaseMarkets.reduce((sum, market) => sum + market.volume, 0);
  const statusLabel = view === 'live' ? 'Ao vivo' : 'Futuros';
  const isFutures = view === 'futures';

  return (
    <section className="pm-league-section">
      <div className="pm-league-header">
        <div className="pm-league-title-row">
          <h2 className="truncate">{title}</h2>
          <span className="pm-league-status">{statusLabel}</span>
        </div>
        <div className="pm-league-meta">
          <span>{formatCompactVolume(totalVolume)}</span>
          <span>•</span>
          <span>{phaseMarkets.length} mercados</span>
        </div>
      </div>

      {isFutures ? (
        /* ── Futures: horizontal bar chart cards ── */
        <div className="pm-futures-grid">
          {phaseMarkets.slice(0, 30).map((market) => (
            <SportsFuturesCard
              key={`futures-${market.id}`}
              market={market}
              selected={selectedMarketId === market.id}
              onSelect={onSelectMarket}
            />
          ))}
        </div>
      ) : (
        /* ── Live: compact table rows ── */
        <>
          <div className="pm-market-head">
            <span>Partida</span>
            <span className="text-center">Moneyline</span>
            <span className="text-center">Spread</span>
            <span className="text-center">Total</span>
          </div>

          <div className="pm-market-list">
            {phaseMarkets.slice(0, 30).map((market) => (
              <SportsMarketCard
                key={`live-${market.id}`}
                market={market}
                sport={sport}
                phase={view}
                selected={selectedMarketId === market.id}
                onSelect={onSelectMarket}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
