import { useState, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useNews, type PredictionMarket } from '@/hooks/useNews';
import { useTranslatedMarkets } from '@/hooks/useTranslatedMarkets';
import { proxyImage } from '@/lib/image-overrides';
import {
  Search, TrendingUp, Clock, Flame, BarChart3, ChevronRight,
  MessageCircle, Bookmark, Filter, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';

type SortOption = 'trending' | 'liquidity' | 'volume' | 'newest' | 'ending_soon' | 'competitive';
type EventState = 'active' | 'resolved' | 'all';

const CATEGORY_PILLS = [
  'Todos', 'Sports', 'Politics', 'Awards', 'Crypto', 'Esports',
  'Music', 'Elections', 'Culture', 'Tech', 'Finance', 'World',
];

const sortOptions: { id: SortOption; label: string; icon: React.ReactNode }[] = [
  { id: 'trending', label: 'Tendências', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'volume', label: 'Volume', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'newest', label: 'Mais recentes', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'ending_soon', label: 'Termina em breve', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'competitive', label: 'Competitivo', icon: <BarChart3 className="w-3.5 h-3.5" /> },
];

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function formatEndDate(d?: string | null): string {
  if (!d) return '';
  const diff = new Date(d).getTime() - Date.now();
  if (diff <= 0) return 'Encerrado';
  const days = Math.floor(diff / 86400000);
  if (days === 0) {
    const hours = Math.floor(diff / 3600000);
    return hours <= 1 ? 'Encerra em < 1h' : `Encerra em ${hours}h`;
  }
  if (days === 1) return 'Encerra amanhã';
  if (days <= 30) return `Encerra em ${days} dias`;
  const months = Math.floor(days / 30);
  return `Encerra em ${months} ${months === 1 ? 'mês' : 'meses'}`;
}

const Explore = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { markets, loading } = useNews();
  const { translatedMarkets } = useTranslatedMarkets(markets);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [search, setSearch] = useState('');
  const [activePill, setActivePill] = useState('Todos');
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [eventState, setEventState] = useState<EventState>('active');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...translatedMarkets];

    // Category filter
    if (activePill !== 'Todos') {
      const pill = activePill.toLowerCase();
      list = list.filter(m => {
        const cat = m.category?.toLowerCase() || '';
        const text = `${m.question} ${m.originalQuestion || ''} ${m.subtitle}`.toLowerCase();
        return cat.includes(pill) || text.includes(pill);
      });
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

    // Event state
    if (eventState === 'active') {
      list = list.filter(m => {
        if (!m.endDate) return true;
        return new Date(m.endDate).getTime() > Date.now();
      });
    } else if (eventState === 'resolved') {
      list = list.filter(m => m.endDate && new Date(m.endDate).getTime() <= Date.now());
    }

    // Sort
    switch (sortBy) {
      case 'trending':
        list.sort((a, b) => b.volume - a.volume);
        break;
      case 'volume':
        list.sort((a, b) => b.volume - a.volume);
        break;
      case 'newest':
        list.sort((a, b) => {
          const aEnd = a.endDate ? new Date(a.endDate).getTime() : 0;
          const bEnd = b.endDate ? new Date(b.endDate).getTime() : 0;
          return bEnd - aEnd;
        });
        break;
      case 'ending_soon':
        list.sort((a, b) => {
          const aEnd = a.endDate ? new Date(a.endDate).getTime() : Infinity;
          const bEnd = b.endDate ? new Date(b.endDate).getTime() : Infinity;
          return aEnd - bEnd;
        });
        break;
      case 'competitive':
        list.sort((a, b) => {
          const aDiff = Math.abs(a.yesPrice - 0.5);
          const bDiff = Math.abs(b.yesPrice - 0.5);
          return aDiff - bDiff;
        });
        break;
    }

    return list;
  }, [translatedMarkets, activePill, search, sortBy, eventState]);

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} markets={markets} />

      <main className="max-w-[1280px] mx-auto px-4 py-6 pb-24">
        {/* Title */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Explore popular predictions & real-time odds
          </h1>
          <button className="p-2 hover:bg-muted rounded-lg transition-colors">
            <Bookmark className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Category pills - horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {CATEGORY_PILLS.map(pill => (
            <button
              key={pill}
              onClick={() => setActivePill(pill)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activePill === pill
                  ? 'bg-foreground text-background'
                  : 'bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {pill}
            </button>
          ))}
        </div>

        {/* Layout: list + sidebar */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Market list */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p>Nenhum mercado encontrado</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map(market => (
                  <MarketRow key={market.id} market={market} onClick={() => navigate(`/market/${market.id}`)} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: search + filters */}
          <div className="w-full lg:w-[300px] shrink-0 order-first lg:order-last">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar eventos..."
                className="pl-9 text-sm"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Sort options */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Ordenar por</p>
              <div className="flex flex-wrap gap-2">
                {sortOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      sortBy === opt.id
                        ? 'bg-foreground text-background'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Event state */}
            <div className="bg-card border border-border rounded-xl p-4 mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-3">Estado do evento</p>
              <div className="flex gap-2">
                {(['active', 'resolved', 'all'] as EventState[]).map(state => (
                  <button
                    key={state}
                    onClick={() => setEventState(state)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      eventState === state
                        ? 'bg-foreground text-background'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {state === 'active' ? 'Activo' : state === 'resolved' ? 'Resolvido' : 'Todos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear filters */}
            {(search || activePill !== 'Todos' || sortBy !== 'trending' || eventState !== 'active') && (
              <button
                onClick={() => { setSearch(''); setActivePill('Todos'); setSortBy('trending'); setEventState('active'); }}
                className="text-xs text-primary hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <MobileHotbar />
    </div>
  );
};

/* Polymarket-style row item */
function MarketRow({ market, onClick }: { market: PredictionMarket; onClick: () => void }) {
  const topOption = market.isMultiOption && market.options?.length
    ? market.options.reduce((a, b) => (b.price > a.price ? b : a), market.options[0])
    : null;

  const displayPercent = topOption
    ? Math.round(topOption.price * 100)
    : Math.round(market.yesPrice * 100);

  const displayLabel = topOption?.label || undefined;

  const catLabel = market.category?.charAt(0).toUpperCase() + (market.category?.slice(1) || '');
  const sportLabel = market.sportLabel || market.sportKey?.toUpperCase();
  const subLabel = sportLabel || (market.subtitle?.length < 30 ? market.subtitle : '');

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3.5 px-2 hover:bg-muted/40 transition-colors text-left group"
    >
      {/* Image */}
      <img
        src={proxyImage(market.imageUrl)}
        alt=""
        className="w-10 h-10 rounded-lg object-cover shrink-0 bg-muted"
        loading="lazy"
        onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] text-muted-foreground">{catLabel}</span>
          {subLabel && (
            <>
              <span className="text-[10px] text-muted-foreground">·</span>
              <span className="text-[11px] text-muted-foreground">{subLabel}</span>
            </>
          )}
        </div>
        <p className="text-sm font-medium text-foreground truncate pr-4">{market.question}</p>
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
          <span>{formatVolume(market.volume)} Vol.</span>
          {market.endDate && (
            <>
              <span>·</span>
              <span>{formatEndDate(market.endDate)}</span>
            </>
          )}
        </div>
      </div>

      {/* Percentage */}
      <div className="text-right shrink-0 pr-1">
        <p className="text-xl font-bold text-foreground">{displayPercent}%</p>
        {displayLabel && (
          <p className="text-[10px] text-muted-foreground max-w-[80px] truncate">{displayLabel}</p>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
    </button>
  );
}

export default Explore;
