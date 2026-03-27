import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Sparkles, TrendingUp, Flame, Droplets, Timer, Landmark, Trophy, Bitcoin, DollarSign, Globe, Cpu, Palette, BarChart3, Zap, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PredictionMarket } from '@/hooks/useNews';

const browseFilters = [
  { id: 'new', label: 'Novo', icon: Sparkles },
  { id: 'trending', label: 'Tendências', icon: TrendingUp },
  { id: 'popular', label: 'Popular', icon: Flame },
  { id: 'liquid', label: 'Líquido', icon: Droplets },
  { id: 'ending', label: 'Termina em breve', icon: Timer },
];

const topics = [
  { id: 'crypto', label: 'Criptomoedas', icon: Bitcoin, color: 'hsl(38, 90%, 50%)' },
  { id: 'politics', label: 'Política', icon: Landmark, color: 'hsl(220, 70%, 55%)' },
  { id: 'sports', label: 'Desporto', icon: Trophy, color: 'hsl(145, 60%, 45%)' },
  { id: 'finance', label: 'Finanças', icon: DollarSign, color: 'hsl(160, 70%, 40%)' },
  { id: 'world', label: 'Médio Oriente', icon: Globe, color: 'hsl(200, 60%, 50%)' },
  { id: 'tech', label: 'Tecnologia', icon: Cpu, color: 'hsl(260, 60%, 55%)' },
  { id: 'culture', label: 'Cultura Pop', icon: Palette, color: 'hsl(330, 70%, 55%)' },
  { id: 'economy', label: 'Economia', icon: BarChart3, color: 'hsl(180, 50%, 45%)' },
  { id: 'health', label: 'IA', icon: Zap, color: 'hsl(45, 80%, 50%)' },
];

interface SearchDropdownProps {
  onSearch?: (query: string) => void;
  onCategoryChange?: (category: string) => void;
  markets?: PredictionMarket[];
  className?: string;
}

export function SearchDropdown({ onSearch, onCategoryChange, markets = [], className }: SearchDropdownProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trendingMarkets = useMemo(() => {
    return [...markets]
      .filter(m => m.volume > 0)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 6);
  }, [markets]);

  const searchResults = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return markets
      .filter(m => {
        const text = `${m.question} ${m.originalQuestion || ''} ${m.subtitle}`.toLowerCase();
        return text.includes(q);
      })
      .slice(0, 8);
  }, [query, markets]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleFilterClick = (filterId: string) => {
    onCategoryChange?.(filterId === 'new' ? 'trending' : filterId);
    setIsOpen(false);
    navigate('/');
  };

  const handleTopicClick = (topicId: string) => {
    onCategoryChange?.(topicId);
    setIsOpen(false);
    navigate('/');
  };

  const handleMarketClick = (market: PredictionMarket) => {
    setIsOpen(false);
    setQuery('');
    onSearch?.('');
    navigate(`/market/${market.id}`);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Pesquisar na OnChoice..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-8 bg-secondary border-border"
        />
        {query && (
          <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        )}
      </div>

      {isOpen && query && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 p-2 animate-in fade-in-0 zoom-in-95 duration-150 max-h-[400px] overflow-y-auto">
          <p className="text-[11px] font-semibold text-muted-foreground tracking-wider mb-2 px-2">RESULTADOS</p>
          {searchResults.map((m) => (
            <button
              key={m.id}
              onClick={() => handleMarketClick(m)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors text-left"
            >
              <img
                src={m.imageUrl}
                alt=""
                className="w-8 h-8 rounded-lg object-cover shrink-0 bg-secondary"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{m.question}</p>
                <p className="text-xs text-muted-foreground">{m.subtitle}</p>
              </div>
              <span className="text-xs font-bold text-primary shrink-0">
                {Math.round(m.yesPrice * 100)}%
              </span>
            </button>
          ))}
        </div>
      )}

      {isOpen && query && searchResults.length === 0 && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 p-4 animate-in fade-in-0 zoom-in-95 duration-150">
          <p className="text-sm text-muted-foreground text-center">Nenhum resultado para "{query}"</p>
        </div>
      )}

      {isOpen && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-xl z-50 p-3 animate-in fade-in-0 zoom-in-95 duration-150 max-h-[480px] overflow-y-auto">
          {/* Trending markets with images */}
          {trendingMarkets.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground tracking-wider mb-2 px-1">EM ALTA</p>
              {trendingMarkets.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => handleMarketClick(m)}
                  className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <img
                    src={m.imageUrl}
                    alt=""
                    className="w-9 h-9 rounded-lg object-cover shrink-0 bg-secondary"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">{m.question}</p>
                  </div>
                  <span className="text-xs font-bold text-foreground tabular-nums shrink-0">
                    {Math.round(m.yesPrice * 100)}%
                  </span>
                </button>
              ))}
            </div>
          )}

          <p className="text-[11px] font-semibold text-muted-foreground tracking-wider mb-2 px-1">NAVEGAR</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {browseFilters.map((f) => {
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => handleFilterClick(f.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-secondary/50 text-sm font-medium text-foreground hover:bg-primary/10 hover:border-primary/50 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {f.label}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] font-semibold text-muted-foreground tracking-wider mb-2 px-1">TÓPICOS</p>
          <div className="grid grid-cols-2 gap-0.5">
            {topics.map((tp) => {
              const Icon = tp.icon;
              return (
                <button
                  key={tp.id}
                  onClick={() => handleTopicClick(tp.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span
                    className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: `${tp.color}20` }}
                  >
                    <Icon className="h-4 w-4" style={{ color: tp.color }} />
                  </span>
                  {tp.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
