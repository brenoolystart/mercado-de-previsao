import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { PredictionMarket } from '@/hooks/useNews';
import { proxyImage } from '@/lib/image-overrides';
import { LiveIndicator } from '@/components/LiveIndicator';
import { Palette, Music, Trophy, Film, Sparkles, Flame, Users, Globe, Mic2 } from 'lucide-react';

interface CultureHubProps {
  markets: PredictionMarket[];
  loading: boolean;
}

const CULTURE_SUBCATEGORIES = [
  { id: 'all', label: 'Todos', icon: Sparkles },
  { id: 'entertainment', label: 'Entretenimento', icon: Film, terms: ['movie', 'film', 'tv', 'show', 'netflix', 'disney', 'streaming', 'big brother', 'bbb', 'reality', 'entertainment', 'series'] },
  { id: 'music', label: 'Música', icon: Music, terms: ['music', 'album', 'concert', 'spotify', 'grammy', 'song', 'rapper', 'singer', 'artist', 'tour', 'taylor swift', 'drake', 'beyonce', 'bad bunny', 'kendrick', 'olivia rodrigo', 'dua lipa', 'sabrina carpenter', 'the weeknd', 'bruno mars'] },
  { id: 'awards', label: 'Premiações', icon: Trophy, terms: ['oscar', 'grammy', 'emmy', 'award', 'golden globe', 'ballon d\'or', 'golden ball', 'golden boot', 'best player', 'best picture', 'best actor', 'best actress', 'nomination'] },
  { id: 'social', label: 'Social', icon: Users, terms: ['tweet', 'twitter', 'tiktok', 'instagram', 'youtube', 'social media', 'influencer', 'viral', 'meme', 'podcast', 'follower', 'subscriber', 'x post'] },
  { id: 'celebrity', label: 'Celebridades', icon: Mic2, terms: ['celebrity', 'pregnancy', 'pregnant', 'baby', 'dating', 'married', 'divorce', 'scandal', 'confirmed', 'gravida', 'nara smith', 'kardashian', 'kanye'] },
  { id: 'religion', label: 'Religião', icon: Globe, terms: ['pope', 'jesus', 'christ', 'religion', 'church', 'vatican', 'bible', 'god', 'faith', 'prayer'] },
];

function formatVolume(num: number): string {
  if (num >= 1000000) return `R$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `R$${(num / 1000).toFixed(0)}K`;
  return `R$${num}`;
}

function CultureMarketCard({ market, onNavigate }: { market: PredictionMarket; onNavigate: () => void }) {
  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const isMulti = market.isMultiOption && market.options && market.options.length > 2;
  const isLive = market.volume > 100000 && market.volume < 5000000;

  return (
    <article
      onClick={onNavigate}
      className="group relative bg-card border border-border rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Image banner */}
      <div className="relative h-28 bg-secondary overflow-hidden">
        <img
          src={proxyImage(market.imageUrl)}
          alt=""
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
        {isLive && (
          <div className="absolute top-2 right-2">
            <LiveIndicator size="sm" label="AO VIVO" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 -mt-6 relative">
        <h3 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-snug mb-2">
          {market.question}
        </h3>

        {isMulti ? (
          <div className="space-y-1">
            {market.options!.slice(0, 3).map((opt, i) => {
              const pct = Math.round(opt.price * 100);
              return (
                <div key={i} className="flex items-center gap-2">
                  {(opt.icon || opt.image) && (
                    <img src={proxyImage(opt.icon || opt.image)} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 border border-border" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  )}
                  <span className="text-[11px] text-muted-foreground truncate flex-1">{opt.label}</span>
                  <span className="text-[11px] font-bold text-foreground tabular-nums">{pct}%</span>
                </div>
              );
            })}
            {market.options!.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{market.options!.length - 3} mais</span>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            <button
              className="py-1.5 rounded-md text-xs font-bold transition-all"
              style={{ backgroundColor: 'hsla(152, 69%, 36%, 0.2)', color: 'hsl(152, 69%, 46%)' }}
              onClick={(e) => { e.stopPropagation(); onNavigate(); }}
            >Sim {yesPercent}%</button>
            <button
              className="py-1.5 rounded-md text-xs font-bold transition-all"
              style={{ backgroundColor: 'hsla(0, 72%, 51%, 0.2)', color: 'hsl(0, 72%, 60%)' }}
              onClick={(e) => { e.stopPropagation(); onNavigate(); }}
            >Não {noPercent}%</button>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
          <span className="font-medium">{formatVolume(market.volume)} Vol</span>
        </div>
      </div>
    </article>
  );
}

export function CultureHub({ markets, loading }: CultureHubProps) {
  const navigate = useNavigate();
  const [activeSub, setActiveSub] = useState('all');

  const filteredMarkets = useMemo(() => {
    if (activeSub === 'all') return markets;
    const sub = CULTURE_SUBCATEGORIES.find(s => s.id === activeSub);
    if (!sub || !sub.terms) return markets;

    return markets.filter(m => {
      const text = `${m.question} ${m.originalQuestion || ''} ${m.subtitle}`.toLowerCase();
      return sub.terms!.some(term => text.includes(term));
    });
  }, [markets, activeSub]);

  const handleNavigate = (market: PredictionMarket) => {
    if (market.isMultiOption && market.options && market.options.length > 2) {
      const params = new URLSearchParams({ id: market.id, title: encodeURIComponent(market.question), image: encodeURIComponent(market.imageUrl), volume: market.volume.toString(), options: encodeURIComponent(JSON.stringify(market.options)) });
      if (market.endDate) params.set('endDate', market.endDate);
      navigate(`/market-detail?${params.toString()}`);
    } else {
      const params = new URLSearchParams({ id: market.id, title: encodeURIComponent(market.question), yes: market.yesPrice.toString(), image: encodeURIComponent(market.imageUrl) });
      if (market.outcomeLabels) params.set('outcomeLabels', encodeURIComponent(JSON.stringify(market.outcomeLabels)));
      if (market.endDate) params.set('endDate', market.endDate);
      if (market.volume) params.set('volume', market.volume.toString());
      navigate(`/market?${params.toString()}`);
    }
  };

  // Featured market: highest volume culture market
  const featured = useMemo(() => {
    const sorted = [...filteredMarkets].sort((a, b) => b.volume - a.volume);
    return sorted[0] || null;
  }, [filteredMarkets]);

  const otherMarkets = useMemo(() => {
    if (!featured) return filteredMarkets;
    return filteredMarkets.filter(m => m.id !== featured.id);
  }, [filteredMarkets, featured]);

  if (loading && markets.length === 0) {
    return (
      <div className="py-8 space-y-4">
        <div className="h-8 bg-secondary rounded animate-pulse w-64" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 bg-secondary rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Cultura & Entretenimento</h2>
        </div>
        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
          {filteredMarkets.length} mercados
        </span>
      </div>

      {/* Subcategory pills */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {CULTURE_SUBCATEGORIES.map(sub => {
          const Icon = sub.icon;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSub(sub.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border transition-all whitespace-nowrap shrink-0',
                activeSub === sub.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* Featured hero card */}
      {featured && (
        <div
          onClick={() => handleNavigate(featured)}
          className="relative rounded-xl overflow-hidden cursor-pointer group border border-border"
        >
          <div className="relative h-40 md:h-48 bg-secondary">
            <img
              src={proxyImage(featured.imageUrl)}
              alt=""
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Destaque</span>
            </div>
            <h3 className="text-base md:text-lg font-bold text-foreground line-clamp-2">{featured.question}</h3>
            <div className="flex items-center gap-3 mt-2">
              {featured.isMultiOption && featured.options ? (
                <div className="flex items-center gap-2">
                  {featured.options.slice(0, 3).map((opt, i) => (
                    <span key={i} className="text-xs font-semibold text-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
                      {opt.label}: {Math.round(opt.price * 100)}%
                    </span>
                  ))}
                </div>
              ) : (
                <div className="flex gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-md" style={{ backgroundColor: 'hsla(152, 69%, 36%, 0.3)', color: 'hsl(152, 69%, 46%)' }}>
                    Sim {Math.round(featured.yesPrice * 100)}%
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-md" style={{ backgroundColor: 'hsla(0, 72%, 51%, 0.3)', color: 'hsl(0, 72%, 60%)' }}>
                    Não {Math.round(featured.noPrice * 100)}%
                  </span>
                </div>
              )}
              <span className="text-[11px] text-muted-foreground">{formatVolume(featured.volume)} Vol</span>
            </div>
          </div>
        </div>
      )}

      {/* Markets grid - Kalshi style: image-first cards */}
      {otherMarkets.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {otherMarkets.map(market => (
            <CultureMarketCard
              key={market.id}
              market={market}
              onNavigate={() => handleNavigate(market)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Palette className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum mercado de cultura encontrado nesta categoria.</p>
        </div>
      )}
    </div>
  );
}