import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { PredictionMarket } from '@/hooks/useNews';
import { getLabelInitials } from '@/lib/sports-meta';
import { getOptionImageSource, overrideOptionImages, proxyImage } from '@/lib/image-overrides';

interface SportsFuturesCardProps {
  market: PredictionMarket;
  selected: boolean;
  onSelect: (marketId: string) => void;
}

const BAR_COLORS = [
  'hsl(199 89% 48%)',    // blue
  'hsl(215 60% 65%)',    // steel
  'hsl(45 93% 48%)',     // gold
  'hsl(152 69% 45%)',    // green
  'hsl(340 75% 55%)',    // pink
  'hsl(26 92% 56%)',     // orange
  'hsl(280 65% 60%)',    // purple
  'hsl(0 72% 51%)',      // red
];

function getBarColor(index: number) {
  return BAR_COLORS[index % BAR_COLORS.length];
}

export function SportsFuturesCard({ market, selected, onSelect }: SportsFuturesCardProps) {
  const rawOptions = market.isMultiOption && market.options?.length
    ? market.options.sort((a, b) => b.price - a.price).slice(0, 8)
    : null;
  const options = useMemo(() => rawOptions ? overrideOptionImages(rawOptions) : null, [rawOptions]);

  if (!options) return null;

  const maxPrice = Math.max(...options.map(o => o.price), 0.01);
  const title = market.question;

  return (
    <article
      className={cn(
        'pm-futures-card',
        selected && 'pm-futures-card-selected'
      )}
      onClick={() => onSelect(market.id)}
      role="button"
      tabIndex={0}
    >
      <h3 className="pm-futures-title">{title}</h3>

      <div className="pm-futures-list">
        {options.map((option, i) => {
          const pct = Math.round(option.price * 100);
          const barWidth = Math.max((option.price / maxPrice) * 100, 2);
          const optionImage = getOptionImageSource(option, market.imageUrl);

          return (
            <div key={`${market.id}-fo-${i}`} className="pm-futures-row">
              <div className="pm-futures-team">
                {optionImage ? (
                  <img src={proxyImage(optionImage)} alt={option.label} className="pm-futures-logo" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <span className="pm-futures-logo-fallback" style={{ backgroundColor: getBarColor(i) }}>
                    {getLabelInitials(option.label)}
                  </span>
                )}
                <span className="pm-futures-label truncate">{option.label}</span>
              </div>
              <span className="pm-futures-pct">{pct}%</span>
              <div className="pm-futures-bar-track">
                <div
                  className="pm-futures-bar-fill"
                  style={{ width: `${barWidth}%`, backgroundColor: getBarColor(i) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {options.length < (market.options?.length || 0) && (
        <button
          type="button"
          className="pm-futures-show-more"
          onClick={(e) => { e.stopPropagation(); onSelect(market.id); }}
        >
          Ver mais ↓
        </button>
      )}
    </article>
  );
}
