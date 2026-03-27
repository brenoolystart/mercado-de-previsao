import { cn } from '@/lib/utils';
import {
  TrendingUp,
  Landmark,
  Trophy,
  Bitcoin,
  DollarSign,
  Globe,
  Cpu,
  Palette,
  BarChart3,
  Zap,
  ChevronLeft,
  ChevronRight,
  Radio,
  Newspaper,
  Sparkles,
  ChevronDown,
  Vote,
  CloudSun,
  AtSign,
  Shield,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export interface Category {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  isDynamic?: boolean;
}

// Icon map for dynamic category lookup
export const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trending: TrendingUp,
  breaking: Newspaper,
  new: Sparkles,
  politics: Landmark,
  sports: Trophy,
  crypto: Bitcoin,
  finance: DollarSign,
  geopolitics: Globe,
  tech: Cpu,
  culture: Palette,
  world: Globe,
  economy: BarChart3,
  health: Zap,
  elections: Vote,
  weather: CloudSun,
  mentions: AtSign,
  security: Shield,
  live: Radio,
};

// Fixed categories that always show (like Polymarket's Trending | Breaking | New)
const fixedCategories: Category[] = [
  { id: 'trending', labelKey: 'categories.trending', icon: TrendingUp },
  { id: 'breaking', labelKey: 'categories.breaking', icon: Newspaper },
  { id: 'new', labelKey: 'categories.new', icon: Sparkles },
];

// Fallback static categories
export const defaultCategories: Category[] = [
  ...fixedCategories,
  { id: 'politics', labelKey: 'categories.politics', icon: Landmark },
  { id: 'sports', labelKey: 'categories.sports', icon: Trophy },
  { id: 'crypto', labelKey: 'categories.crypto', icon: Bitcoin },
  { id: 'finance', labelKey: 'categories.finance', icon: DollarSign },
  { id: 'tech', labelKey: 'categories.tech', icon: Cpu },
  { id: 'world', labelKey: 'categories.world', icon: Globe },
];

interface TrendingTopic {
  id: string;
  label: string;
}

interface CategoriesProps {
  activeCategory: string;
  activeSubcategory: string;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  trendingTopics?: TrendingTopic[];
  showSubcategories?: boolean;
  categoryCounts?: Record<string, number>;
  dynamicCategories?: Category[];
}

const MAX_VISIBLE_TABS = 14;

export function Categories({
  activeCategory,
  activeSubcategory,
  onCategoryChange,
  onSubcategoryChange,
  trendingTopics = [],
  showSubcategories = true,
  categoryCounts = {},
  dynamicCategories,
}: CategoriesProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [showMore, setShowMore] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  const allCategories = dynamicCategories && dynamicCategories.length > 0
    ? dynamicCategories
    : defaultCategories;

  const visibleCategories = allCategories.slice(0, MAX_VISIBLE_TABS);
  const overflowCategories = allCategories.slice(MAX_VISIBLE_TABS);

  // Close "More" dropdown on outside click
  useEffect(() => {
    if (!showMore) return;
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMore(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMore]);

  // Deduplicate subcategories by id
  const seen = new Set<string>();
  const subcategories = [
    { id: 'all', label: t('categories.all') },
    ...trendingTopics.filter(topic => {
      if (topic.id === 'all' || seen.has(topic.id)) return false;
      seen.add(topic.id);
      return true;
    }),
  ];

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    handleScroll();
  }, [subcategories.length]);

  const isFixedId = (id: string) => id === 'trending' || id === 'breaking' || id === 'new';

  return (
    <div className="bg-card border-b border-border" data-tour="categories">
      <nav className="border-b border-border">
        <div className="container">
          <div className="flex items-center gap-0 overflow-x-auto hide-scrollbar py-0">
            {visibleCategories.map((category, idx) => {
              const Icon = category.icon;
              const isFixed = isFixedId(category.id);
              // Show separator after the fixed group
              const showSep = isFixed && idx < visibleCategories.length - 1 && !isFixedId(visibleCategories[idx + 1]?.id);

              return (
                <div key={category.id} className="flex items-center shrink-0">
                  <button
                    onClick={() => onCategoryChange(category.id)}
                    className={cn(
                      'flex items-center gap-1 px-2 md:px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors shrink-0',
                      activeCategory === category.id
                        ? 'text-foreground border-primary'
                        : 'text-muted-foreground border-transparent hover:text-foreground'
                    )}
                    style={{ minHeight: 'auto', minWidth: 'auto' }}
                  >
                    {category.id === 'trending' && <Icon className="w-4 h-4" />}
                    <span>{t(category.labelKey, category.labelKey.split('.').pop())}</span>
                  </button>
                  {showSep && (
                    <div className="w-px h-4 bg-border mx-1 shrink-0" />
                  )}
                </div>
              );
            })}

            {/* More dropdown */}
            {overflowCategories.length > 0 && (
              <div ref={moreRef} className="relative shrink-0">
                <button
                  onClick={() => setShowMore(!showMore)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 md:px-3.5 py-2.5 text-xs md:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors',
                    overflowCategories.some(c => c.id === activeCategory)
                      ? 'text-foreground border-primary'
                      : 'text-muted-foreground border-transparent hover:text-foreground'
                  )}
                  style={{ minHeight: 'auto', minWidth: 'auto' }}
                >
                  <span>{t('categories.more', 'More')}</span>
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showMore && 'rotate-180')} />
                </button>

                {showMore && (
                  <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 py-1 min-w-[160px] animate-in fade-in-0 zoom-in-95 duration-150">
                    {overflowCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => {
                          onCategoryChange(category.id);
                          setShowMore(false);
                        }}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors text-left',
                          activeCategory === category.id
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-muted'
                        )}
                      >
                        <span>{t(category.labelKey, category.labelKey.split('.').pop())}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {showSubcategories && (
        <div className="container py-2 relative">
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-gradient-to-r from-card via-card to-transparent pr-4 hidden sm:flex"
              style={{ minHeight: 'auto', minWidth: 'auto' }}
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-2 overflow-x-auto hide-scrollbar"
          >
            {subcategories.map((sub, idx) => (
              <button
                key={`${sub.id}-${idx}`}
                onClick={() => onSubcategoryChange(sub.id)}
                className={cn(
                  'px-2.5 py-1 text-[11px] md:text-xs font-medium rounded-full border transition-all duration-200 whitespace-nowrap shrink-0',
                  activeSubcategory === sub.id
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border hover:bg-primary/10 hover:border-primary/50'
                )}
                style={{ minHeight: 'auto', minWidth: 'auto' }}
              >
                {sub.label}
              </button>
            ))}
          </div>

          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1 bg-gradient-to-l from-card via-card to-transparent pl-4 hidden sm:flex"
              style={{ minHeight: 'auto', minWidth: 'auto' }}
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
