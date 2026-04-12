import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { proxyImage } from '@/lib/image-overrides';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Market {
  id: string;
  question: string;
  imageUrl?: string;
  yesPrice: number;
  volume: number;
  category?: string;
  isMultiOption?: boolean;
  options?: { label: string; price: number; image?: string }[];
  outcomeLabels?: string[];
  endDate?: string;
  sportKey?: string;
}

interface PickedForYouProps {
  markets: Market[];
}

function formatVolume(v: number): string {
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B Vol.`;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M Vol.`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K Vol.`;
  return `$${v} Vol.`;
}

/* Pick 4 diverse markets with high volume */
function pickMarkets(markets: Market[]): Market[] {
  if (markets.length === 0) return [];

  const sorted = [...markets].sort((a, b) => b.volume - a.volume);
  const picked: Market[] = [];
  const usedCategories = new Set<string>();

  // First pass: pick diverse categories
  for (const m of sorted) {
    if (picked.length >= 4) break;
    const cat = m.category || 'other';
    if (!usedCategories.has(cat)) {
      usedCategories.add(cat);
      picked.push(m);
    }
  }

  // Fill remaining slots
  for (const m of sorted) {
    if (picked.length >= 4) break;
    if (!picked.find(p => p.id === m.id)) {
      picked.push(m);
    }
  }

  return picked;
}

function MarketPickCard({ market, onClick }: { market: Market; onClick: () => void }) {
  const isMulti = market.isMultiOption && market.options && market.options.length > 2;
  const topOptions = isMulti ? market.options!.slice(0, 3) : null;

  return (
    <div
      onClick={onClick}
      className="picked-card group"
    >
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-3">
        {market.imageUrl && (
          <img
            src={proxyImage(market.imageUrl)}
            alt=""
            className="w-8 h-8 rounded-md object-cover shrink-0"
          />
        )}
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {market.question}
        </h3>
      </div>

      {/* Options */}
      <div className="flex-1 space-y-2">
        {isMulti && topOptions ? (
          topOptions.map((opt, i) => (
            <div key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {opt.image && (
                  <img src={proxyImage(opt.image)} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                )}
                <span className="text-sm text-foreground truncate">{opt.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm font-semibold text-foreground">{Math.round(opt.price * 100)}%</span>
                <button className="picked-btn-yes">Sim</button>
                <button className="picked-btn-no">Não</button>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-foreground">
              {market.outcomeLabels?.[0] || 'Sim'}
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">{Math.round(market.yesPrice * 100)}%</span>
              <button className="picked-btn-yes">Sim</button>
              <button className="picked-btn-no">Não</button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        <span className="text-xs text-muted-foreground">{formatVolume(market.volume)}</span>
      </div>
    </div>
  );
}

export function PickedForYou({ markets }: PickedForYouProps) {
  const navigate = useNavigate();
  const picks = useMemo(() => pickMarkets(markets), [markets]);

  if (picks.length === 0) return null;

  return (
    <div className="my-6">
      <h2 className="text-lg font-bold text-foreground mb-4">Escolhidos pra você</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {picks.map(market => (
          <MarketPickCard
            key={market.id}
            market={market}
            onClick={() => navigate(`/market/${market.id}`)}
          />
        ))}
      </div>
      <div className="flex justify-center mt-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground gap-1"
          onClick={() => navigate('/explore')}
        >
          <ChevronDown className="w-4 h-4" />
          Ver mais
        </Button>
      </div>
    </div>
  );
}
