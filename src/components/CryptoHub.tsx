import { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Bitcoin, Bookmark, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import type { PredictionMarket } from '@/hooks/useNews';
import { proxyImage } from '@/lib/image-overrides';
import { LiveIndicator } from '@/components/LiveIndicator';

interface CryptoHubProps {
  markets: PredictionMarket[];
  loading: boolean;
}

type CryptoSubTab = 'all' | 'updown' | 'above' | 'price_range' | 'hit_price';

const CRYPTO_COINS = [
  { id: 'bitcoin', label: 'Bitcoin', icon: '₿', color: 'hsl(38, 90%, 50%)' },
  { id: 'ethereum', label: 'Ethereum', icon: 'Ξ', color: 'hsl(230, 60%, 55%)' },
  { id: 'solana', label: 'Solana', icon: 'S', color: 'hsl(260, 80%, 60%)' },
  { id: 'xrp', label: 'XRP', icon: 'X', color: 'hsl(210, 10%, 50%)' },
  { id: 'dogecoin', label: 'Dogecoin', icon: 'Ð', color: 'hsl(38, 75%, 55%)' },
];

const TIME_FILTERS = [
  { id: '5min', label: '5 Min' },
  { id: '15min', label: '15 Min' },
  { id: 'hourly', label: '1 Hora' },
  { id: '4hour', label: '4 Horas' },
  { id: 'daily', label: 'Diário' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensal' },
  { id: 'yearly', label: 'Anual' },
  { id: 'premarket', label: 'Pré-Mercado' },
  { id: 'etf', label: 'ETF' },
];

const SUB_TABS: { id: CryptoSubTab; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'updown', label: 'Para Cima / Baixo' },
  { id: 'above', label: 'Acima / Abaixo' },
  { id: 'price_range', label: 'Faixa de Preço' },
  { id: 'hit_price', label: 'Atingir Preço' },
];

function matchesCoin(market: PredictionMarket, coinId: string): boolean {
  const q = ((market.originalQuestion || '') + ' ' + market.question).toLowerCase();
  const map: Record<string, string[]> = {
    bitcoin: ['bitcoin', 'btc'],
    ethereum: ['ethereum', 'eth'],
    solana: ['solana', 'sol'],
    xrp: ['xrp', 'ripple'],
    dogecoin: ['dogecoin', 'doge'],
  };
  return (map[coinId] || []).some(k => q.includes(k));
}

function matchesTimeFilter(market: PredictionMarket, timeId: string): boolean {
  const q = ((market.originalQuestion || '') + ' ' + market.question).toLowerCase();
  const map: Record<string, string[]> = {
    '5min': ['5 min', '5-min', '5min'],
    '15min': ['15 min', '15-min', '15min'],
    'hourly': ['hourly', '1 hour', '1-hour', '1 hora'],
    '4hour': ['4 hour', '4-hour', '4hour', '4 horas'],
    'daily': ['daily', '24 hour', '24-hour', 'today', 'end of day', 'diário'],
    'weekly': ['weekly', 'this week', 'end of week', 'semanal'],
    'monthly': ['monthly', 'this month', 'end of month', 'mensal'],
    'yearly': ['yearly', 'this year', 'end of year', '2025', '2026', 'anual'],
    'premarket': ['pre-market', 'premarket', 'pre market'],
    'etf': ['etf'],
  };
  return (map[timeId] || []).some(k => q.includes(k));
}

function matchesSubTab(market: PredictionMarket, tab: CryptoSubTab): boolean {
  if (tab === 'all') return true;
  const q = ((market.originalQuestion || '') + ' ' + market.question).toLowerCase();
  const map: Record<string, string[]> = {
    updown: ['up or down', 'up down', 'up/down', 'para cima', 'para baixo'],
    above: ['above', 'below', 'acima', 'abaixo'],
    price_range: ['price range', 'between', 'faixa de preço', 'entre'],
    hit_price: ['hit', 'reach', 'touch', 'atingir'],
  };
  return (map[tab] || []).some(k => q.includes(k));
}

function isUpDownMarket(market: PredictionMarket): boolean {
  const q = ((market.originalQuestion || '') + ' ' + market.question).toLowerCase();
  return /up or down|up\/down|up down|para cima.*para baixo|para baixo.*para cima/i.test(q);
}

function getOptionLabel(label: string): string {
  const map: Record<string, string> = {
    'Yes': 'Sim', 'No': 'Não',
    'Up': 'Para cima', 'Down': 'Para baixo',
    'Above': 'Acima', 'Below': 'Abaixo',
    'Over': 'Acima', 'Under': 'Abaixo',
    'Higher': 'Maior', 'Lower': 'Menor',
  };
  return map[label] || label;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(0) + 'K';
  return num.toString();
}

/* ── Donut chart for Up/Down markets ── */
function DonutChart({ pct, label }: { pct: number; label: string }) {
  const r = 28, stroke = 6;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 72, height: 72 }}>
      <svg width={72} height={72} className="-rotate-90">
        <circle cx={36} cy={36} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
        <circle cx={36} cy={36} r={r} fill="none" stroke="hsl(var(--green))" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold text-foreground tabular-nums">{pct}%</span>
        <span className="text-[9px] font-semibold leading-none" style={{ color: 'hsl(var(--green))' }}>{label}</span>
      </div>
    </div>
  );
}

function CryptoCard({ market }: { market: PredictionMarket }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    if (market.isMultiOption && market.options && market.options.length > 2) {
      const params = new URLSearchParams({
        id: market.id,
        title: encodeURIComponent(market.question),
        image: encodeURIComponent(market.imageUrl),
        volume: market.volume.toString(),
        options: encodeURIComponent(JSON.stringify(market.options)),
      });
      if (market.endDate) params.set('endDate', market.endDate);
      navigate(`/market-detail?${params.toString()}`);
    } else {
      const params = new URLSearchParams({
        id: market.id,
        title: encodeURIComponent(market.question),
        yes: market.yesPrice.toString(),
        image: encodeURIComponent(market.imageUrl),
      });
      if (market.outcomeLabels) params.set('outcomeLabels', encodeURIComponent(JSON.stringify(market.outcomeLabels)));
      if (market.endDate) params.set('endDate', market.endDate);
      if (market.clobTokenIds?.[0]) params.set('tokenId', market.clobTokenIds[0]);
      if (market.volume) params.set('volume', market.volume.toString());
      if (market.category) params.set('category', market.category);
      navigate(`/market?${params.toString()}`);
    }
  };

  const upDown = isUpDownMarket(market);
  const yesPct = Math.round(market.yesPrice * 100);
  const noPct = Math.round(market.noPrice * 100);

  const multiOpts = market.isMultiOption && market.options && market.options.length > 2
    ? market.options
    : null;

  return (
    <div onClick={handleClick} className="pm-crypto-card">
      {/* ── Header: icon + title ── */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-secondary border border-border overflow-hidden shrink-0">
          {!imageError ? (
            <img src={proxyImage(market.imageUrl)} alt="" className="w-full h-full object-cover" onError={() => setImageError(true)} loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <Bitcoin className="w-4 h-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <h3 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 flex-1 min-w-0">
          {market.question}
        </h3>
        {/* Donut for Up/Down */}
        {upDown && <DonutChart pct={yesPct} label="Para cima" />}
      </div>

      {/* ── Body ── */}
      {upDown ? (
        /* Up/Down special layout: two big colored buttons */
        <div className="flex gap-2 mb-2">
          <button
            className="flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors"
            style={{ backgroundColor: 'hsl(var(--green) / 0.15)', color: 'hsl(var(--green))' }}
            onClick={e => { e.stopPropagation(); handleClick(); }}
          >
            Para cima
          </button>
          <button
            className="flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors"
            style={{ backgroundColor: 'hsl(var(--red) / 0.15)', color: 'hsl(var(--red))' }}
            onClick={e => { e.stopPropagation(); handleClick(); }}
          >
            Para baixo
          </button>
        </div>
      ) : multiOpts ? (
        /* Multi-option: show each option row with Sim./Não. */
        <div className="space-y-1.5 mb-2">
          {multiOpts.slice(0, 5).map((opt, i) => {
            const pct = Math.round(opt.price * 100);
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">{getOptionLabel(opt.label)}</span>
                <span className="text-xs font-bold text-foreground tabular-nums shrink-0">{pct}%</span>
                <div className="flex gap-1 shrink-0">
                  <button className="pm-crypto-yes-btn" onClick={e => { e.stopPropagation(); handleClick(); }}>Sim.</button>
                  <button className="pm-crypto-no-btn" onClick={e => { e.stopPropagation(); handleClick(); }}>Não.</button>
                </div>
              </div>
            );
          })}
          {multiOpts.length > 5 && (
            <span className="text-[11px] text-muted-foreground">+{multiOpts.length - 5} mais</span>
          )}
        </div>
      ) : (
        /* Binary market: two rows with translated outcome labels + Sim./Não. */
        <div className="space-y-1.5 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
              {getOptionLabel(market.outcomeLabels?.[0] || 'Yes')}
            </span>
            <span className="text-xs font-bold text-foreground tabular-nums shrink-0">{yesPct}%</span>
            <div className="flex gap-1 shrink-0">
              <button className="pm-crypto-yes-btn" onClick={e => { e.stopPropagation(); handleClick(); }}>Sim.</button>
              <button className="pm-crypto-no-btn" onClick={e => { e.stopPropagation(); handleClick(); }}>Não.</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground truncate flex-1 min-w-0">
              {getOptionLabel(market.outcomeLabels?.[1] || 'No')}
            </span>
            <span className="text-xs font-bold text-foreground tabular-nums shrink-0">{noPct}%</span>
            <div className="flex gap-1 shrink-0">
              <button className="pm-crypto-yes-btn" onClick={e => { e.stopPropagation(); handleClick(); }}>Sim.</button>
              <button className="pm-crypto-no-btn" onClick={e => { e.stopPropagation(); handleClick(); }}>Não.</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          {market.volume > 0 && <span>R${formatNumber(market.volume)} Vol.</span>}
          {market.volume > 100000 && market.volume < 5000000 && (
            <LiveIndicator size="sm" label="AO VIVO" />
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-muted-foreground/50 hover:text-foreground cursor-pointer transition-colors" />
        </div>
      </div>
    </div>
  );
}

export function CryptoHub({ markets, loading }: CryptoHubProps) {
  const [activeCoin, setActiveCoin] = useState('all');
  const [activeTime, setActiveTime] = useState('all');
  const [activeTab, setActiveTab] = useState<CryptoSubTab>('all');

  const coinCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CRYPTO_COINS.forEach(c => {
      counts[c.id] = markets.filter(m => matchesCoin(m, c.id)).length;
    });
    return counts;
  }, [markets]);

  const timeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    TIME_FILTERS.forEach(t => {
      counts[t.id] = markets.filter(m => matchesTimeFilter(m, t.id)).length;
    });
    return counts;
  }, [markets]);

  const filtered = useMemo(() => {
    let result = markets;
    if (activeCoin !== 'all') {
      result = result.filter(m => matchesCoin(m, activeCoin));
    }
    if (activeTime !== 'all') {
      result = result.filter(m => matchesTimeFilter(m, activeTime));
    }
    result = result.filter(m => matchesSubTab(m, activeTab));
    return result;
  }, [markets, activeCoin, activeTime, activeTab]);

  return (
    <section className="pm-sports-shell">
      <div className="pm-sports-layout" style={{ gridTemplateColumns: '220px minmax(0, 1fr)' }}>
        {/* ── LEFT SIDEBAR ── */}
        <aside className="pm-sports-sidebar">
          <div className="px-2 pt-3 pb-1">
            <button
              onClick={() => { setActiveCoin('all'); setActiveTime('all'); }}
              className={cn('pm-sport-row', activeCoin === 'all' && activeTime === 'all' && 'pm-sport-row-active')}
            >
              <span className="flex items-center gap-2.5">
                <span className="truncate text-[13px] font-medium">Todos</span>
              </span>
              <span className="pm-sport-count">{markets.length}</span>
            </button>
          </div>

          {/* Filtros por período */}
          <nav className="pm-sidebar-nav">
            {TIME_FILTERS.map(t => (
              timeCounts[t.id] > 0 && (
                <button
                  key={t.id}
                  onClick={() => { setActiveTime(t.id); setActiveCoin('all'); }}
                  className={cn('pm-sport-row', activeTime === t.id && 'pm-sport-row-active')}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="truncate text-[13px] font-medium">{t.label}</span>
                  </span>
                  <span className="pm-sport-count">{timeCounts[t.id]}</span>
                </button>
              )
            ))}
          </nav>

          {/* Filtros por moeda */}
          <div className="border-t border-border mx-2" />
          <nav className="pm-sidebar-nav pt-2">
            {CRYPTO_COINS.map(coin => (
              coinCounts[coin.id] > 0 && (
                <button
                  key={coin.id}
                  onClick={() => { setActiveCoin(coin.id); setActiveTime('all'); }}
                  className={cn('pm-sport-row', activeCoin === coin.id && 'pm-sport-row-active')}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shrink-0"
                      style={{ backgroundColor: coin.color }}
                    >
                      {coin.icon}
                    </span>
                    <span className="truncate text-[13px] font-medium">{coin.label}</span>
                  </span>
                  <span className="pm-sport-count">{coinCounts[coin.id]}</span>
                </button>
              )
            ))}
          </nav>
        </aside>

        {/* ── CENTER FEED ── */}
        <div className="pm-center-feed">
          <div className="pm-board-header">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="pm-board-title">Criptomoedas</h1>
              {/* Sub-tabs */}
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
                {SUB_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap shrink-0',
                      activeTab === tab.id
                        ? 'bg-secondary text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" className="pm-icon-btn" aria-label="Buscar">
                <Search className="h-4 w-4" />
              </button>
              <button type="button" className="pm-icon-btn" aria-label="Filtrar">
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="pm-crypto-card animate-pulse">
                  <div className="flex gap-2.5 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-secondary" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-secondary rounded w-full" />
                      <div className="h-3 bg-secondary rounded w-2/3" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="h-6 bg-secondary rounded" />
                    <div className="h-6 bg-secondary rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              Nenhum mercado cripto encontrado nesta categoria.
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(market => (
                <CryptoCard key={market.id} market={market} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
