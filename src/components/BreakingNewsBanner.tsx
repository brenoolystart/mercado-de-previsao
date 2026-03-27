import { useNavigate } from 'react-router-dom';
import { ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PredictionMarket } from '@/hooks/useNews';

interface BreakingNewsBannerProps {
  markets: PredictionMarket[];
}

export function BreakingNewsBanner({ markets }: BreakingNewsBannerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const breakingNews = [...markets]
    .filter((m) => m.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 3);

  if (breakingNews.length === 0) return null;

  const handleMarketClick = (market: PredictionMarket) => {
    if (market.isMultiOption && market.options && market.options.length > 2) {
      const params = new URLSearchParams({ id: market.id, title: encodeURIComponent(market.question), image: encodeURIComponent(market.imageUrl), volume: market.volume.toString(), options: encodeURIComponent(JSON.stringify(market.options)) });
      if (market.endDate) params.set('endDate', market.endDate);
      navigate(`/market-detail?${params.toString()}`);
    } else {
      const params = new URLSearchParams({ id: market.id, title: encodeURIComponent(market.question), yes: market.yesPrice.toString(), image: encodeURIComponent(market.imageUrl) });
      if (market.endDate) params.set('endDate', market.endDate);
      if (market.clobTokenIds?.[0]) params.set('tokenId', market.clobTokenIds[0]);
      if (market.volume) params.set('volume', market.volume.toString());
      if (market.category) params.set('category', market.category);
      navigate(`/market?${params.toString()}`);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <span className="text-sm font-bold text-foreground">{t('markets.breakingNews')}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="space-y-3">
        {breakingNews.map((market, idx) => {
          const pct = Math.round(market.yesPrice * 100);
          const changeFromBaseline = Math.round((market.yesPrice - 0.5) * 100);
          const isUp = changeFromBaseline >= 0;
          return (
            <button key={market.id} onClick={() => handleMarketClick(market)} className="w-full flex items-start gap-2 text-left hover:bg-secondary/50 rounded-md p-1.5 -mx-1.5 transition-colors">
              <span className="text-xs font-bold text-muted-foreground/50 mt-0.5 shrink-0">{idx + 1}</span>
              <span className="text-xs text-foreground font-medium leading-snug flex-1 min-w-0 line-clamp-2">{market.question}</span>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-sm font-bold text-foreground">{pct}%</span>
                <span className={`flex items-center gap-0.5 text-[10px] font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                  {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {isUp ? '↑' : '↓'} {Math.abs(changeFromBaseline)}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
