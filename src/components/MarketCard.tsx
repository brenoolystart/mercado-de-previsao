import { useNavigate } from 'react-router-dom';
import { Star, Bookmark, TrendingUp, Landmark, Trophy, Bitcoin, Globe, Cpu, Palette, BarChart3, Zap, Sparkles, FileText, Radio, ChevronDown } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PredictionMarket } from '@/hooks/useNews';
import { getMarketImageOverride, getOptionImageSource, overrideOptionImages, proxyImage } from '@/lib/image-overrides';
import { LiveIndicator } from '@/components/LiveIndicator';
import { getTeamColor } from '@/lib/team-colors';

interface MarketCardProps {
  market: PredictionMarket;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  trending: TrendingUp, finance: BarChart3, tech: Cpu, politics: Landmark,
  sports: Trophy, crypto: Bitcoin, world: Globe, geopolitics: Globe,
  culture: Palette, economy: BarChart3, health: Zap, new: Sparkles,
  break: TrendingUp, gains: BarChart3, elections: FileText, trump: Landmark,
};

const outcomeTranslations: Record<string, string> = {
  'Yes': 'Sim', 'No': 'Não',
  'Up': 'Subir', 'Down': 'Descer',
  'Above': 'Acima', 'Below': 'Abaixo',
  'Over': 'Acima', 'Under': 'Abaixo',
  'Higher': 'Maior', 'Lower': 'Menor',
  'Bullish': 'Alta', 'Bearish': 'Baixa',
};

function translateOutcome(label: string, fallback: string): string {
  return outcomeTranslations[label] || label || fallback;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function MultiOptionDisplay({ options, eventImage, onOptionClick }: {
  options: { label: string; price: number; color?: string; icon?: string; image?: string }[];
  eventImage?: string;
  onOptionClick: () => void;
}) {
  return (
    <div className="relative">
      <div className="space-y-0.5 max-h-[72px] overflow-y-auto scrollbar-none hover:scrollbar-thin scroll-smooth" style={{ scrollbarWidth: 'none' }}>
        <style>{`.scrollbar-none::-webkit-scrollbar { display: none; } .scrollbar-none:hover::-webkit-scrollbar { display: block; width: 3px; } .scrollbar-none:hover::-webkit-scrollbar-thumb { background: hsl(var(--muted-foreground) / 0.3); border-radius: 10px; } .scrollbar-none:hover::-webkit-scrollbar-track { background: transparent; }`}</style>
        {options.map((option, idx) => {
          const percent = Math.round(option.price * 100);
          const optionImage = getOptionImageSource(option, eventImage);
          return (
            <div key={idx} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-secondary/30 rounded transition-colors px-1" onClick={onOptionClick}>
              {optionImage && (
                <img src={proxyImage(optionImage)} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 border border-border" loading="lazy" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />
              )}
              <span className="text-[12px] text-foreground font-medium truncate min-w-0 flex-1">{option.label}</span>
              <span className="text-[12px] font-bold text-foreground tabular-nums shrink-0">{percent < 1 ? '<1' : percent}%</span>
              <button className="px-2 py-0.5 text-[10px] font-semibold rounded transition-colors shrink-0" style={{ backgroundColor: 'hsla(152, 69%, 36%, 0.2)', color: 'hsl(152, 69%, 46%)' }} onClick={(e) => { e.stopPropagation(); onOptionClick(); }}>Sim</button>
              <button className="px-2 py-0.5 text-[10px] font-semibold rounded transition-colors shrink-0" style={{ backgroundColor: 'hsla(0, 72%, 51%, 0.2)', color: 'hsl(0, 72%, 60%)' }} onClick={(e) => { e.stopPropagation(); onOptionClick(); }}>Não</button>
            </div>
          );
        })}
      </div>
      {options.length > 3 && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-card to-transparent" />
      )}
    </div>
  );
}

export function MarketCard({ market }: MarketCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const resolvedImage = useMemo(() => getMarketImageOverride(market.question, market.imageUrl), [market.question, market.imageUrl]);

  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('onchoice_favorites') || '[]');
      return favs.includes(market.id);
    } catch { return false; }
  });

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); e.preventDefault();
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const favs: string[] = JSON.parse(localStorage.getItem('onchoice_favorites') || '[]');
      const updated = next ? [...favs, market.id] : favs.filter(id => id !== market.id);
      localStorage.setItem('onchoice_favorites', JSON.stringify(updated));
    } catch {}
  };

  const handleClick = () => {
    if (isMultiOption) {
      const params = new URLSearchParams({ id: market.id, title: encodeURIComponent(market.question), image: encodeURIComponent(market.imageUrl), volume: market.volume.toString(), options: encodeURIComponent(JSON.stringify(resolvedOptions || market.options)) });
      if (market.endDate) params.set('endDate', market.endDate);
      navigate(`/market-detail?${params.toString()}`);
    } else {
      const params = new URLSearchParams({ id: market.id, title: encodeURIComponent(market.question), yes: market.yesPrice.toString(), image: encodeURIComponent(market.imageUrl) });
      if (market.outcomeLabels) params.set('outcomeLabels', encodeURIComponent(JSON.stringify(market.outcomeLabels)));
      if (market.endDate) params.set('endDate', market.endDate);
      if (market.clobTokenIds?.[0]) params.set('tokenId', market.clobTokenIds[0]);
      if (market.volume) params.set('volume', market.volume.toString());
      if (market.category) params.set('category', market.category);
      navigate(`/market?${params.toString()}`);
    }
  };

  const yesPercent = Math.round(market.yesPrice * 100);
  const noPercent = Math.round(market.noPrice * 100);
  const isLive = market.isLive || (market.liveScores && market.liveScores.length > 0);
  const isMultiOption = market.isMultiOption && market.options && market.options.length > 2;
  const resolvedOptions = useMemo(() => isMultiOption ? overrideOptionImages(market.options!) : market.options, [market.options, isMultiOption]);
  const yesLabel = translateOutcome(market.outcomeLabels?.[0] || '', t('common.yes'));
  const noLabel = translateOutcome(market.outcomeLabels?.[1] || '', t('common.no'));
  const CategoryIcon = categoryIcons[market.category] || TrendingUp;

  const yesTeamColor = useMemo(() => getTeamColor(yesLabel), [yesLabel]);
  const noTeamColor = useMemo(() => getTeamColor(noLabel), [noLabel]);
  const isSportsMarket = market.category === 'sports' || !!market.sportKey;

  return (
    <div onClick={handleClick} className="market-card animate-fade-in relative">
      {/* Header: image + title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0">
          {!imageError ? (
            <img src={proxyImage(resolvedImage)} alt="" className="w-full h-full object-cover" onError={() => setImageError(true)} loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary"><CategoryIcon className="w-4 h-4 text-muted-foreground" /></div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-foreground line-clamp-2 leading-[1.4]">{market.question}</h3>
        </div>
      </div>

      {/* Live Score Banner for sports */}
      {isSportsMarket && isLive && market.liveScores && market.liveScores.length >= 2 && (
        <div className="mb-2 rounded-xl border border-red-500/20 bg-red-500/5 p-2">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Ao Vivo</span>
            {market.liveScores[0]?.period && (
              <span className="text-[10px] text-muted-foreground ml-auto">{market.liveScores[0].period}</span>
            )}
          </div>
          <div className="space-y-1">
            {market.liveScores.slice(0, 2).map((score, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-foreground truncate flex-1">{score.team}</span>
                <span className="text-[14px] font-bold text-foreground tabular-nums ml-2">{score.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sport label badge */}
      {isSportsMarket && market.sportLabel && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{market.sportLabel}</span>
          {market.seriesTitle && <span className="text-[10px] text-muted-foreground">{market.seriesTitle}</span>}
        </div>
      )}

      {/* Botões Sim/Não */}
      <div className="mb-2">
        {isMultiOption ? (
          <MultiOptionDisplay options={resolvedOptions!} eventImage={market.imageUrl} onOptionClick={handleClick} />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              className="py-2.5 rounded-full text-[13px] font-bold transition-all duration-150 hover:brightness-110"
              style={{
                backgroundColor: yesTeamColor ? `hsla(${yesTeamColor} / 0.15)` : 'hsla(152, 69%, 36%, 0.15)',
                color: yesTeamColor ? `hsl(${yesTeamColor})` : 'hsl(152, 69%, 46%)',
              }}
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
            >{yesLabel} {yesPercent}%</button>
            <button
              className="py-2.5 rounded-full text-[13px] font-bold transition-all duration-150 hover:brightness-110"
              style={{
                backgroundColor: noTeamColor ? `hsla(${noTeamColor} / 0.15)` : 'hsla(0, 72%, 51%, 0.15)',
                color: noTeamColor ? `hsl(${noTeamColor})` : 'hsl(0, 72%, 60%)',
              }}
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
            >{noLabel} {noPercent}%</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="font-medium">R${formatNumber(market.volume)} Vol</span>
          {isLive && (<><span className="text-muted-foreground/60">·</span><LiveIndicator size="sm" label="AO VIVO" /></>)}
          {market.endDate && !isLive && (
            <>
              <span className="text-muted-foreground/60">·</span>
              <span>{new Date(market.endDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
            </>
          )}
        </div>
        <button onClick={handleFavorite} className={`transition-colors ${isFavorite ? 'text-foreground' : 'text-muted-foreground/50 hover:text-foreground'}`}>
          <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}