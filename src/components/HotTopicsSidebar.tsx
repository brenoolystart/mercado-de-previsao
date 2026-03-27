import { ChevronRight, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PredictionMarket } from '@/hooks/useNews';

interface HotTopicsSidebarProps {
  markets: PredictionMarket[];
  onCategoryChange: (cat: string) => void;
}

export function HotTopicsSidebar({ markets, onCategoryChange }: HotTopicsSidebarProps) {
  const { t } = useTranslation();

  const categoryVolumes = markets.reduce<Record<string, number>>((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + m.volume;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryVolumes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (topCategories.length === 0) return null;

  const formatVol = (v: number) => {
    if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(0)}M`;
    if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`;
    return `R$${v}`;
  };

  return (
    <div>
      <div className="flex items-center gap-1 mb-3">
        <span className="text-sm font-bold text-foreground">{t('markets.hotTopics')}</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="space-y-2.5">
        {topCategories.map(([cat, vol], idx) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className="w-full flex items-center gap-2 text-left hover:bg-secondary/50 rounded-md p-1.5 -mx-1.5 transition-colors group"
          >
            <span className="text-xs font-bold text-muted-foreground/50 w-3 shrink-0">{idx + 1}</span>
            <span className="text-sm font-bold text-foreground flex-1">{t(`categories.${cat}`, cat)}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground">{formatVol(vol)} {t('markets.today')}</span>
              <TrendingUp className="w-3 h-3 text-primary" />
              <ChevronRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
