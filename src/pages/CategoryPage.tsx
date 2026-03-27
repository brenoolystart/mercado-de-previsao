import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useNews, type PredictionMarket } from '@/hooks/useNews';
import { useTranslatedMarkets } from '@/hooks/useTranslatedMarkets';
import { proxyImage } from '@/lib/image-overrides';
import { Search, Bookmark, ChevronRight, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { MarketCard } from '@/components/MarketCard';

export interface CategorySubFilter {
  id: string;
  label: string;
  keywords: string[];
  icon?: React.ReactNode;
}

export interface CategoryPageConfig {
  categoryId: string;
  title: string;
  subTabs?: { id: string; label: string }[];
  sidebarFilters: CategorySubFilter[];
}

function countMatches(markets: PredictionMarket[], filter: CategorySubFilter, categoryId: string): number {
  if (filter.id === 'all') return markets.filter(m => matchesCategory(m, categoryId)).length;
  return markets.filter(m => matchesCategory(m, categoryId) && matchesFilter(m, filter)).length;
}

function matchesCategory(m: PredictionMarket, categoryId: string): boolean {
  const cat = m.category?.toLowerCase() || '';
  const text = `${m.question} ${m.originalQuestion || ''} ${m.subtitle}`.toLowerCase();
  
  // Direct category match
  if (cat === categoryId) return true;
  
  // Broader matching for related categories
  switch (categoryId) {
    case 'politics':
      return cat === 'politics' || cat === 'elections' || text.includes('president') || text.includes('eleição') || text.includes('congress') || text.includes('trump') || text.includes('governo') || text.includes('senado');
    case 'crypto':
      return cat === 'crypto' || text.includes('bitcoin') || text.includes('ethereum') || text.includes('btc') || text.includes('eth') || text.includes('solana') || text.includes('crypto');
    case 'finance':
      return cat === 'finance' || text.includes('stock') || text.includes('ação') || text.includes('fed') || text.includes('interest rate') || text.includes('s&p') || text.includes('nasdaq');
    case 'geopolitics':
      return cat === 'geopolitics' || cat === 'world' || text.includes('war') || text.includes('guerra') || text.includes('sanctions') || text.includes('treaty') || text.includes('nato');
    case 'tech':
      return cat === 'tech' || text.includes('ai ') || text.includes('artificial intelligence') || text.includes('inteligência artificial') || text.includes('apple') || text.includes('google') || text.includes('openai');
    case 'economy':
      return cat === 'economy' || text.includes('gdp') || text.includes('pib') || text.includes('inflation') || text.includes('inflação') || text.includes('recession') || text.includes('recessão');
    default:
      return cat.includes(categoryId);
  }
}

function matchesFilter(m: PredictionMarket, filter: CategorySubFilter): boolean {
  const text = `${m.question} ${m.originalQuestion || ''} ${m.subtitle} ${m.seriesTitle || ''}`.toLowerCase();
  return filter.keywords.some(kw => text.includes(kw.toLowerCase()));
}

export default function CategoryPage({ config }: { config: CategoryPageConfig }) {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { markets, loading } = useNews();
  const { translatedMarkets } = useTranslatedMarkets(markets);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState(config.subTabs?.[0]?.id || 'all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = translatedMarkets.filter(m => matchesCategory(m, config.categoryId));

    // Sub-filter from sidebar
    if (activeFilter !== 'all') {
      const filter = config.sidebarFilters.find(f => f.id === activeFilter);
      if (filter) {
        list = list.filter(m => matchesFilter(m, filter));
      }
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.question.toLowerCase().includes(q) ||
        m.subtitle.toLowerCase().includes(q) ||
        (m.originalQuestion || '').toLowerCase().includes(q)
      );
    }

    // Sort by volume
    list.sort((a, b) => b.volume - a.volume);

    return list;
  }, [translatedMarkets, config, activeFilter, search]);

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} markets={markets} />

      <main className="max-w-[1280px] mx-auto px-4 py-6 pb-24">
        <div className="flex gap-6">
          {/* Left sidebar - subcategory filters */}
          <aside className="hidden lg:block w-[240px] shrink-0">
            <div className="sticky top-20 space-y-0.5">
              {config.sidebarFilters.map(filter => {
                const count = countMatches(translatedMarkets, filter, config.categoryId);
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeFilter === filter.id
                        ? 'bg-muted font-semibold text-foreground'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {filter.icon}
                      <span className="truncate">{filter.label}</span>
                    </span>
                    <span className={`text-xs tabular-nums ${
                      activeFilter === filter.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header: Title + tabs + search */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                <h1 className="text-xl md:text-2xl font-bold text-foreground">
                  {config.title}
                </h1>
                {config.subTabs && config.subTabs.length > 1 && (
                  <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-0.5">
                    {config.subTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          activeTab === tab.id
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="pl-8 h-8 text-xs w-[180px]"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                      <X className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                </div>
                <button className="p-1.5 hover:bg-muted rounded-lg transition-colors">
                  <Bookmark className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* Mobile sidebar filter pills */}
            <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
              {config.sidebarFilters.slice(0, 8).map(filter => {
                const count = countMatches(translatedMarkets, filter, config.categoryId);
                return (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      activeFilter === filter.id
                        ? 'bg-foreground text-background'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className="text-[10px] opacity-70">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Market grid - 3 columns like Polymarket */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-48 bg-muted/50 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg font-medium">Nenhum mercado encontrado</p>
                <p className="text-sm mt-1">Tente outro filtro ou busca</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(market => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileHotbar />
    </div>
  );
}
