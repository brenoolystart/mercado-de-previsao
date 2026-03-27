import { forwardRef, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SportSummary, SportsBoardView } from '@/lib/sports';
import { getSportIcon } from '@/lib/sports-meta';

interface SportsHubProps {
  summaries: SportSummary[];
  activeSport: string;
  activeView: SportsBoardView;
  onSportChange: (sportId: string) => void;
  onViewChange: (view: SportsBoardView) => void;
  children?: ReactNode;
  tradePanel?: ReactNode;
}

function getSportStyle(colorVar: string) {
  return { '--sport-accent': `var(${colorVar})` } as CSSProperties;
}

function getViewCount(summary: SportSummary, view: SportsBoardView) {
  return view === 'live' ? summary.liveCount : summary.futuresCount;
}

export const SportsHub = forwardRef<HTMLElement, SportsHubProps>(function SportsHub(
  { summaries, activeSport, activeView, onSportChange, onViewChange, children, tradePanel },
  ref
) {
  // Auto-switch view when selecting a sport that only exists in the other view
  useEffect(() => {
    if (activeSport === 'all') return;
    const current = summaries.find((s) => s.id === activeSport);
    if (!current || current.count === 0) {
      onSportChange('all');
      return;
    }
    // If current sport has 0 in active view but has markets in the other view, auto-switch
    if (getViewCount(current, activeView) === 0) {
      const otherView: SportsBoardView = activeView === 'live' ? 'futures' : 'live';
      if (getViewCount(current, otherView) > 0) {
        onViewChange(otherView);
      } else {
        onSportChange('all');
      }
    }
  }, [activeView, activeSport, summaries, onSportChange, onViewChange]);

  return (
    <section ref={ref} aria-label="Sports" className="pm-sports-shell">
      <div className="pm-sports-layout">
        {/* ── LEFT SIDEBAR ── */}
        <aside className="pm-sports-sidebar">
          <div className="pm-sports-mode-switch">
            <button
              type="button"
              onClick={() => onViewChange('live')}
              className={cn('pm-sports-mode-btn', activeView === 'live' && 'pm-sports-mode-btn-active')}
            >
              <span className="pm-live-dot" />
              Ao vivo
            </button>
            <button
              type="button"
              onClick={() => onViewChange('futures')}
              className={cn('pm-sports-mode-btn', activeView === 'futures' && 'pm-sports-mode-btn-active')}
            >
              Futuros
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSportChange('all')}
            className={cn('pm-sport-row', activeSport === 'all' && 'pm-sport-row-active')}
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="truncate text-[13px] font-medium">Todos os Esportes</span>
            </span>
            <span className="pm-sport-count">{summaries.reduce((sum, s) => sum + getViewCount(s, activeView), 0)}</span>
          </button>

          <nav className="pm-sidebar-nav">
          {summaries.filter((sport) => sport.count > 0).map((sport) => {
              const count = getViewCount(sport, activeView);
              const hasInOtherView = getViewCount(sport, activeView === 'live' ? 'futures' : 'live') > 0;
              const isActive = activeSport === sport.id;
              const Icon = getSportIcon(sport.id);
              const isDisabledInView = count === 0;

              return (
                <button
                  key={sport.id}
                  type="button"
                  onClick={() => onSportChange(sport.id)}
                  className={cn(
                    'pm-sport-row',
                    isActive && 'pm-sport-row-active',
                    isDisabledInView && 'opacity-50'
                  )}
                  style={getSportStyle(sport.colorVar)}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    {sport.imageUrl ? (
                      <img src={sport.imageUrl} alt={sport.label} className="pm-sport-icon" loading="lazy" />
                    ) : (
                      <Icon className="pm-sport-svg-icon" style={{ color: `hsl(var(${sport.colorVar}))` }} />
                    )}
                    <span className="truncate text-[13px] font-medium">{sport.label}</span>
                  </span>
                  <span className="pm-sport-count">{count > 0 ? count : (hasInOtherView ? '•' : '0')}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── CENTER FEED ── */}
        <div className="pm-center-feed">
          <div className="pm-board-header">
            <h1 className="pm-board-title">{activeView === 'live' ? 'Ao Vivo' : 'Futuros'}</h1>
            <div className="flex items-center gap-2">
              <button type="button" className="pm-icon-btn" aria-label="Buscar mercados">
                <Search className="h-4 w-4" />
              </button>
              <button type="button" className="pm-icon-btn" aria-label="Filtrar mercados">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {children}
        </div>

        {/* ── RIGHT TRADE PANEL ── */}
        {tradePanel ? (
          <aside className="pm-trade-aside">
            <div className="pm-trade-sticky">{tradePanel}</div>
          </aside>
        ) : null}
      </div>
    </section>
  );
});
