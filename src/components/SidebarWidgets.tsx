import { useNavigate } from 'react-router-dom';
import { ChevronRight, Flame, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import type { PredictionMarket } from '@/hooks/useNews';

interface SidebarWidgetsProps {
  markets: PredictionMarket[];
  onTopicClick?: (topic: string) => void;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `R$${(vol / 1_000_000).toFixed(0)}M`;
  if (vol >= 1_000) return `R$${(vol / 1_000).toFixed(1)}K`;
  return `R$${vol.toFixed(0)}`;
}

export function SidebarWidgets({ markets, onTopicClick }: SidebarWidgetsProps) {
  const navigate = useNavigate();

  // Breaking news: top 3 markets with highest yes price movement (simulated via price extremes)
  const breakingNews = markets
    .filter((m) => !m.isMultiOption)
    .sort((a, b) => Math.abs(b.yesPrice - 0.5) - Math.abs(a.yesPrice - 0.5))
    .slice(0, 3);

  // Hot topics: top 5 by volume, extract category keywords
  const hotTopics = markets
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 5)
    .map((m) => {
      // Extract a short topic keyword from the question
      const words = m.question.split(' ').filter((w) => w.length > 3);
      const keyword = words.slice(0, 2).join(' ');
      return { id: m.id, label: keyword, volume: m.volume, market: m };
    });

  const handleMarketClick = (market: PredictionMarket) => {
    if (market.isMultiOption && market.options && market.options.length > 2) {
      const params = new URLSearchParams({
        id: market.id,
        title: encodeURIComponent(market.question),
        image: encodeURIComponent(market.imageUrl),
        volume: market.volume.toString(),
        options: encodeURIComponent(JSON.stringify(market.options)),
      });
      navigate(`/market-detail?${params.toString()}`);
    } else {
      const params = new URLSearchParams({
        id: market.id,
        title: encodeURIComponent(market.question),
        yes: market.yesPrice.toString(),
        image: encodeURIComponent(market.imageUrl),
      });
      if (market.category) params.set('category', market.category);
      navigate(`/market?${params.toString()}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breaking News */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            Últimas notícias
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          {breakingNews.map((market, idx) => {
            const pct = Math.round(market.yesPrice * 100);
            const diff = Math.round((market.yesPrice - 0.5) * 200);
            const isUp = diff >= 0;
            return (
              <div
                key={market.id}
                onClick={() => handleMarketClick(market)}
                className="flex items-start gap-2.5 cursor-pointer group"
              >
                <span className="text-xs font-bold text-muted-foreground/50 mt-0.5 w-4 shrink-0">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {market.question}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-foreground">{pct}%</span>
                  <div className={`flex items-center gap-0.5 text-[10px] font-medium ${isUp ? 'text-green' : 'text-red'}`}>
                    {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isUp ? '↑' : '↓'} {Math.abs(diff)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hot Topics */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-destructive" />
            Tópicos quentes
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-2.5">
          {hotTopics.map((topic, idx) => (
            <div
              key={topic.id}
              onClick={() => handleMarketClick(topic.market)}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <span className="text-xs font-bold text-muted-foreground/50 w-4 shrink-0">
                {idx + 1}
              </span>
              <span className="flex-1 text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {topic.label}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs font-medium text-green">
                  {formatVolume(topic.volume)} today
                </span>
                <Flame className="w-3 h-3 text-destructive" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
