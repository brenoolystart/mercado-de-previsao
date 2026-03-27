import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { PredictionMarket, SpreadEntry, TotalEntry, ScoreEntry } from '@/hooks/useNews';
import type { SportDefinition, SportsBoardView } from '@/lib/sports';
import { getMarketCompetitors, getSportsOptionPair } from '@/lib/sports';
import { getLabelInitials } from '@/lib/sports-meta';
import { getImageOverride, getOptionImageSource, overrideOptionImages, proxyImage } from '@/lib/image-overrides';

interface SportsMarketCardProps {
  market: PredictionMarket;
  sport: SportDefinition;
  phase: SportsBoardView;
  selected: boolean;
  onSelect: (marketId: string) => void;
}

/* ── Team badge colors (Polymarket-style) ── */
const BADGE_COLORS: Record<string, string> = {
  DAL: '#0053bc', ORL: '#0077c0', UTA: '#002b5c', WAS: '#e31837',
  BKN: '#000000', MIA: '#98002e', GSW: '#1d428a', LAL: '#552583',
  BOS: '#007a33', PHI: '#006bb6', NYK: '#f58426', CHI: '#ce1141',
  TOR: '#ce1141', MIL: '#00471b', DEN: '#0e2240', PHX: '#1d1160',
  SAC: '#5a2d81', MIN: '#0c2340', CLE: '#860038', ATL: '#e03a3e',
  HOU: '#ce1141', SAS: '#c4ced4', IND: '#002d62', POR: '#e03a3e',
  NOP: '#0c2340', MEM: '#5d76a9', DET: '#c8102e', OKC: '#007ac1',
  CHA: '#1d1160', WAS2: '#002b5c',
};

function getAbbr(label: string) {
  const cleaned = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
  if (cleaned.length > 1) return cleaned[cleaned.length - 1].toUpperCase().slice(0, 3);
  return (cleaned[0] || label).toUpperCase().slice(0, 3);
}

function isDrawLabel(label: string) {
  return /draw|tie|empate/i.test(label);
}

function getDisplayTeams(market: PredictionMarket) {
  // For UFC/fighting sports, prefer option labels directly (they have fighter names + records)
  if (market.options?.length) {
    const optionTeams = market.options.map((o) => o.label).filter((l) => !isDrawLabel(l));
    if (optionTeams.length >= 2) return [optionTeams[0], optionTeams[1]];
  }
  const competitors = getMarketCompetitors(market).filter((item) => !isDrawLabel(item));
  if (competitors.length >= 2) return [competitors[0], competitors[1]];
  const pair = getSportsOptionPair(market);
  if (pair?.length === 2) return [pair[0].label, pair[1].label];
  return [market.question, ''];
}

function getAllOutcomes(market: PredictionMarket) {
  if (market.isMultiOption && market.options?.length) {
    return overrideOptionImages(market.options.map((option) => ({
      label: option.label, price: option.price, icon: option.icon, image: option.image,
    })));
  }
  const pair = getSportsOptionPair(market);
  if (pair?.length) {
    return overrideOptionImages(pair.map((option) => ({
      label: option.label, price: option.price, icon: option.icon, image: option.image,
    })));
  }
  const labels = market.outcomeLabels?.length === 2 ? market.outcomeLabels : ['Sim', 'Não'];
  return [
    { label: labels[0], price: market.yesPrice },
    { label: labels[1], price: market.noPrice },
  ];
}

function getTeamImage(market: PredictionMarket, team: string, teamIndex: number) {
  // Check manual overrides first
  const override = getImageOverride(team);
  if (override) return override;
  // Try exact label match
  const byLabelOption = market.options?.find((option) => option.label === team);
  const byLabel = getOptionImageSource(byLabelOption, market.imageUrl);
  if (byLabel) return byLabel;
  // Fallback: match by index
  const nonDraw = market.options?.filter((o) => !isDrawLabel(o.label));
  if (nonDraw) {
    const byIndex = getOptionImageSource(nonDraw[teamIndex], market.imageUrl);
    if (byIndex) return byIndex;
  }
  return null;
}

function formatOdds(price: number) {
  return `R$${price.toFixed(2).replace('.', ',')}`;
}

function formatVolume(volume: number) {
  if (volume >= 1_000_000) return `R$${(volume / 1_000_000).toFixed(2)}M Vol.`;
  if (volume >= 1_000) return `R$${(volume / 1_000).toFixed(1)}K Vol.`;
  return `R$${Math.round(volume)} Vol.`;
}

function getMatchTime(market: PredictionMarket, isLive: boolean, tLive: string, tNext: string): string {
  if (isLive) return tLive;
  if (market.endDate) {
    try {
      const d = new Date(market.endDate);
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return tNext;
    }
  }
  return tNext;
}

function getBadgeColor(abbr: string) {
  return BADGE_COLORS[abbr] || 'hsl(220 13% 36%)';
}

export const SportsMarketCard = forwardRef<HTMLElement, SportsMarketCardProps>(function SportsMarketCard({ market, sport, phase, selected, onSelect }: SportsMarketCardProps, ref) {
  const { t } = useTranslation();
  const teams = getDisplayTeams(market);
  const outcomes = getAllOutcomes(market).filter(o => !isDrawLabel(o.label));
  const isLive = market.isLive || phase === 'live';
  const matchTime = getMatchTime(market, isLive, t('markets.live'), t('markets.next'));
  const spreads = market.spreadData;
  const totals = market.totalData;
  const scores = market.liveScores;

  // Match spread entries to teams (by index or name matching)
  function getSpreadForTeam(index: number): SpreadEntry | null {
    if (!spreads || spreads.length === 0) return null;
    const team = teams[index];
    if (!team) return null;
    const matched = spreads.find(s => {
      const sAbbr = getAbbr(s.team);
      const tAbbr = getAbbr(team);
      return sAbbr === tAbbr || s.team.toLowerCase().includes(team.toLowerCase().split(' ').pop() || '');
    });
    if (matched) return matched;
    return spreads[index] || null;
  }

  // Get over/under total entries
  function getTotalForRow(index: number): TotalEntry | null {
    if (!totals || totals.length === 0) return null;
    const over = totals.find(t => t.type === 'over');
    const under = totals.find(t => t.type === 'under');
    if (index === 0) return over || totals[0] || null;
    if (index === 1) return under || totals[1] || null;
    return null;
  }

  // Get score for a team by index
  function getScoreForTeam(index: number): ScoreEntry | null {
    if (!scores || scores.length === 0) return null;
    return scores[index] || null;
  }

  return (
    <article
      ref={ref}
      className={cn('pm-market-row', selected && 'pm-market-row-selected')}
      onClick={() => onSelect(market.id)}
      role="button"
      tabIndex={0}
    >
      {/* Header: LIVE status + volume + Game View */}
      <div className="pm-match-header">
        <div className="pm-match-header-left">
          <span className={cn('pm-row-status', isLive && 'pm-row-status-live')}>
            {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-1 animate-pulse" />}
            {matchTime}
          </span>
          {isLive && scores?.[0]?.period && (
            <span className="pm-match-period">{scores[0].period}</span>
          )}
          <span className="pm-match-volume">{formatVolume(market.volume)}</span>
        </div>
        <span className="pm-game-view" onClick={(e) => { e.stopPropagation(); onSelect(market.id); }}>
          {t('markets.gameView')} <ChevronRight className="h-3 w-3" />
        </span>
      </div>

      {/* Grid: Teams | Moneyline | Spread | Total */}
      <div className="pm-match-grid">
        {/* Teams */}
        <div className="pm-team-stack">
          {teams.map((team, index) => {
            if (!team) return null;
            const abbr = getAbbr(team);
            const image = getTeamImage(market, team, index);
            const teamScore = getScoreForTeam(index);
            const isFighter = /ufc|mma|box|fight|zuffa/i.test(market.seriesTitle || market.subtitle || '');
            return (
              <div key={`${market.id}-t-${index}`} className="pm-team-line">
                {image ? (
                  <img
                    src={proxyImage(image)}
                    alt={team}
                    className={isFighter ? 'h-7 w-7 rounded-full border border-border object-cover shrink-0' : 'pm-team-crest'}
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="pm-team-badge"
                    style={{ backgroundColor: getBadgeColor(abbr) }}
                  >
                    {abbr}
                  </span>
                )}
                <span className="pm-team-name">{team}</span>
                {isLive && teamScore != null && (
                  <span className="pm-team-score">{teamScore.score}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Moneyline */}
        <div className="pm-moneyline-group">
          {outcomes.slice(0, 2).map((outcome, i) => {
            const abbr = getAbbr(outcome.label);
            return (
              <button
                key={`${market.id}-o-${i}`}
                type="button"
                onClick={(e) => { e.stopPropagation(); onSelect(market.id); }}
                className={cn('pm-odds-chip', selected ? 'pm-odds-chip-active' : 'pm-odds-chip-buy')}
              >
                <span className="pm-odds-label">{abbr}</span>
                <span className="pm-odds-price">{formatOdds(outcome.price)}</span>
              </button>
            );
          })}
        </div>

        {/* Spread */}
        <div className="pm-spread-total-col">
          {teams.slice(0, 2).map((team, i) => {
            const spread = getSpreadForTeam(i);
            if (!spread) {
              return (
                <div key={`${market.id}-s-${i}`} className="pm-spread-total-cell">
                  <span>—</span>
                </div>
              );
            }
            const abbr = getAbbr(team || '');
            const lineStr = spread.line > 0 ? `+${spread.line}` : `${spread.line}`;
            return (
              <div key={`${market.id}-s-${i}`} className="pm-spread-total-cell">
                <span>{abbr} {lineStr}</span>
                <span>{formatOdds(spread.price)}</span>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="pm-spread-total-col">
          {[0, 1].map((i) => {
            const total = getTotalForRow(i);
            if (!total) {
              return (
                <div key={`${market.id}-tt-${i}`} className="pm-spread-total-cell">
                  <span>—</span>
                </div>
              );
            }
            const prefix = total.type === 'over' ? 'O' : 'U';
            return (
              <div key={`${market.id}-tt-${i}`} className="pm-spread-total-cell">
                <span>{prefix} {total.line}</span>
                <span>{formatOdds(total.price)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
});

SportsMarketCard.displayName = 'SportsMarketCard';
