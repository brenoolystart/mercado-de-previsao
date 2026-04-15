import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { Share2, Bookmark } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { PredictionMarket } from '@/hooks/useNews';
import { proxyImage } from '@/lib/image-overrides';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useTranslation } from 'react-i18next';
import { PredictionMarketChart, type ChartDataPoint, type ChartSeriesConfig } from '@/components/PredictionMarketChart';
import { useMarketHistory } from '@/hooks/useMarketHistory';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';

interface FeaturedMarketProps {
  market: PredictionMarket;
}

// categoryLabels removed - using i18n t('categories.*') instead

const CHART_COLORS = [
  'hsl(38, 92%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(280, 87%, 65%)', 'hsl(0, 84%, 60%)',
  'hsl(217, 91%, 60%)', 'hsl(180, 70%, 45%)',
];

const BOT_COMMENTS = [
  { name: 'BasedTrader', comment: 'Esse mercado vai surpreender muita gente...' },
  { name: 'CryptoMaster', comment: 'Palpitando forte nessa direção' },
  { name: 'AnalystPro', comment: 'Dados indicam mudança de tendência' },
  { name: 'MarketGuru', comment: 'Oportunidade clara aqui, não percam.' },
  { name: 'InvestorX', comment: 'chat is this real ?' },
];

function generateBinaryChartData(market: PredictionMarket) {
  const seed = market.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const points = 60;
  const data = [];
  const target = market.yesPrice * 100;
  const start = 10 + (seed % 20);
  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    const noise = Math.sin(seed + i * 0.7) * 5 + Math.cos(seed * 0.3 + i * 1.2) * 3;
    let val = start * (1 - progress) + target * progress + noise;
    val = Math.max(1, Math.min(99, val));
    data.push({ t: i, pct: Math.round(val * 10) / 10 });
  }
  return data;
}

function generateMultiLineData(market: PredictionMarket) {
  const seed = market.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const points = 50;
  const data = [];
  const opts = market.options!.slice(0, 5);
  for (let i = 0; i < points; i++) {
    const point: any = { t: i };
    opts.forEach((opt, idx) => {
      const baseSeed = seed + idx * 100;
      const target = opt.price * 100;
      const start = 15 + (baseSeed % 25);
      const progress = i / (points - 1);
      const noise = Math.sin(baseSeed + i * 0.5) * 4 + Math.cos(baseSeed * 0.3 + i * 0.8) * 3;
      let value = start * (1 - progress) + target * progress + noise;
      value = Math.max(1, Math.min(99, value));
      point[`opt_${idx}`] = Math.round(value * 10) / 10;
    });
    data.push(point);
  }
  return data;
}

function generateCryptoChartData(market: PredictionMarket) {
  const seed = market.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const points = 40;
  const data = [];
  const basePrice = 60000 + (seed % 10000);
  for (let i = 0; i < points; i++) {
    const noise = Math.sin(seed + i * 0.8) * 50 + Math.cos(seed * 0.4 + i * 1.5) * 30;
    const trend = (i / points) * 100 - 50;
    data.push({ t: i, price: Math.round((basePrice + noise + trend) * 100) / 100 });
  }
  return data;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatVol(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(0)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}K`;
  return `R$${v}`;
}

// Detect market type
function getMarketType(market: PredictionMarket): 'crypto' | 'multi' | 'binary' {
  const q = (market.question + ' ' + (market.originalQuestion || '')).toLowerCase();
  const isCrypto = market.category === 'crypto' || 
    /\b(btc|bitcoin|eth|ethereum|up or down|up down|5.min|5min)\b/i.test(q);
  if (isCrypto && market.endDate) return 'crypto';
  if (market.isMultiOption && market.options && market.options.length > 2) return 'multi';
  return 'binary';
}

export function FeaturedMarket({ market }: FeaturedMarketProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { wallet, placeBet } = useWallet();
  const { toast } = useToast();
  const marketType = getMarketType(market);

  const [position, setPosition] = useState<'yes' | 'no' | null>(null);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [amountStr, setAmountStr] = useState('10');
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [btcInterval, setBtcInterval] = useState('5m');

  // Fetch real CLOB history data when available
  const tokenId = market.clobTokenIds?.[0];
  const { history: realHistory } = useMarketHistory(tokenId, 'ALL');

  // Fetch real Bitcoin price for crypto markets
  const { data: btcData, countdown: btcCountdown, startPrice: btcStartPrice } = useBitcoinPrice(btcInterval);

  const amount = parseFloat(amountStr) || 0;
  const yesLabel = market.outcomeLabels?.[0] || t('common.yes');
  const noLabel = market.outcomeLabels?.[1] || t('common.no');
  const currentPrice = position === 'yes' ? market.yesPrice : market.noPrice;
  const potentialReturn = position ? amount / currentPrice : 0;
  const profit = potentialReturn - amount;

  // Convert real history to chart format, or fall back to generated data
  const binaryChartData: ChartDataPoint[] = useMemo(() => {
    if (realHistory.length > 5) {
      return realHistory.map((p, i) => {
        const d = new Date(p.t * 1000);
        return {
          t: i,
          date: d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' }),
          pct: Math.round(p.p * 1000) / 10,
          pctNo: Math.round((1 - p.p) * 1000) / 10,
        };
      });
    }
    return generateBinaryChartData(market).map((d, i) => ({
      t: i,
      date: d.date,
      pct: d.pct,
      pctNo: 100 - d.pct,
    }));
  }, [realHistory, market]);

  const multiChartData: ChartDataPoint[] = useMemo(() => {
    if (marketType !== 'multi') return [];
    return generateMultiLineData(market).map((d, i) => ({
      ...d, t: i, date: '',
    }));
  }, [market, marketType]);

  const cryptoChartData: ChartDataPoint[] = useMemo(() => {
    if (marketType !== 'crypto') return [];
    return generateCryptoChartData(market).map((d, i) => ({
      ...d, t: i, date: '',
    }));
  }, [market, marketType]);

  // Live BTC chart from real price data
  const liveCryptoChart: ChartDataPoint[] = useMemo(() => {
    if (btcData?.priceHistory && btcData.priceHistory.length > 3) {
      return btcData.priceHistory.map((p, i) => {
        const d = new Date(p.time);
        return {
          t: i,
          date: d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
          price: p.close,
        };
      });
    }
    return cryptoChartData;
  }, [btcData, cryptoChartData]);

  const seed = market.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const botComments = useMemo(() => {
    return BOT_COMMENTS.slice(0, 3).map((bc, i) => ({
      name: BOT_COMMENTS[(seed + i) % BOT_COMMENTS.length].name,
      comment: BOT_COMMENTS[(seed + i) % BOT_COMMENTS.length].comment,
    }));
  }, [seed]);

  const handleClick = () => {
    if (marketType === 'multi') {
      const params = new URLSearchParams({
        id: market.id, title: encodeURIComponent(market.question),
        image: encodeURIComponent(market.imageUrl), volume: market.volume.toString(),
        options: encodeURIComponent(JSON.stringify(market.options)),
      });
      if (market.endDate) params.set('endDate', market.endDate);
      navigate(`/market-detail?${params.toString()}`);
    } else {
      const params = new URLSearchParams({
        id: market.id, title: encodeURIComponent(market.question),
        yes: market.yesPrice.toString(), image: encodeURIComponent(market.imageUrl),
      });
      if (market.endDate) params.set('endDate', market.endDate);
      if (market.clobTokenIds?.[0]) params.set('tokenId', market.clobTokenIds[0]);
      if (market.volume) params.set('volume', market.volume.toString());
      if (market.category) params.set('category', market.category);
      navigate(`/market?${params.toString()}`);
    }
  };

  const handleTrade = async () => {
    if (!position) return;
    if (!isAuthenticated) { toast({ title: t('markets.loginRequired'), variant: 'destructive' }); navigate('/login'); return; }
    if (!wallet) { toast({ title: t('common.error'), description: t('markets.walletNotFound'), variant: 'destructive' }); return; }
    if (amount > wallet.balance) { toast({ title: t('markets.insufficientBalance'), variant: 'destructive' }); return; }
    if (amount <= 0) { toast({ title: t('markets.invalidAmount'), variant: 'destructive' }); return; }
    setIsPlacingBet(true);
    
    let tradePrice = currentPrice;
    let tradeLabel = position === 'yes' ? yesLabel : noLabel;
    if (marketType === 'multi' && selectedOptionIdx !== null && market.options) {
      const opt = market.options[selectedOptionIdx];
      tradePrice = opt.price || 0.01;
      tradeLabel = opt.label;
    }
    
    const result = await placeBet(market.id, market.question, position, amount, tradePrice);
    setIsPlacingBet(false);
    if (result.success) {
      toast({ title: t('markets.betPlaced'), description: t('markets.betPlacedDesc', { amount: formatBRL(amount), label: tradeLabel }) });
      setPosition(null);
      setSelectedOptionIdx(null);
    } else {
      toast({ title: t('common.error'), description: result.error, variant: 'destructive' });
    }
  };

  const catLabel = t(`categories.${market.category}`, market.category);
  const yesPercent = Math.round(market.yesPrice * 100);
  const diff = Math.round((market.yesPrice - 0.5) * 20);
  const isUp = diff >= 0;

  // Shared header
  const renderHeader = () => (
    <>
      <div className="flex items-center gap-2 mb-2">
         <img src={proxyImage(market.imageUrl)} alt="" className="w-8 h-8 rounded-full object-cover bg-secondary border border-border"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        <span className="text-xs text-muted-foreground">{catLabel}</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={(e) => e.stopPropagation()} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={(e) => e.stopPropagation()} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>
      <h2 className="text-lg md:text-xl font-bold text-foreground leading-snug mb-2 line-clamp-2 cursor-pointer hover:underline" onClick={handleClick}>
        {market.question}
      </h2>
    </>
  );

  // Shared betting panel
  const renderBettingPanel = () => position && (
    <div className="mb-4 p-3 rounded-lg bg-secondary/50 border border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground shrink-0">{t('markets.amountLabel')}</span>
        <Input type="text" inputMode="decimal" value={amountStr}
          onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setAmountStr(v); }}
          className="h-8 text-sm w-24" onClick={(e) => e.stopPropagation()} />
        <div className="flex gap-1">
          {[5, 10, 25, 50].map((v) => (
            <button key={v} onClick={(e) => { e.stopPropagation(); setAmountStr(v.toString()); }}
              className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted-foreground/20 text-muted-foreground transition-colors">R${v}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('markets.potentialReturn')} <span className="text-foreground font-bold">{formatBRL(potentialReturn)}</span></span>
        <span>{t('markets.profit')} <span className="text-green-500 font-bold">+{formatBRL(profit)}</span></span>
      </div>
      <Button onClick={(e) => { e.stopPropagation(); handleTrade(); }} disabled={isPlacingBet || amount <= 0}
        className={`w-full h-9 text-sm font-bold ${position === 'yes' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
        {isPlacingBet ? t('markets.processing') : t('markets.betAmount', { amount: formatBRL(amount), label: position === 'yes' ? yesLabel : noLabel })}
      </Button>
    </div>
  );

  const renderFooter = () => (
    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
      <span className="font-medium">{formatVol(market.volume)} Vol</span>
      <div className="flex items-center gap-2">
        {market.endDate && (
          <span>{t('markets.closes')} {new Date(market.endDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        )}
      </div>
    </div>
  );

  // ========== MULTI-OPTION LAYOUT (like "US strikes Iran by...?") ==========
  if (marketType === 'multi') {
    const displayOptions = market.options!.slice(0, 5);
    return (
      <div>
        {renderHeader()}

        {/* Two-column: options list + multi-line chart */}
        <div className="flex flex-col md:flex-row gap-4 mb-3">
          {/* Left: Options with percentages */}
          <div className="flex-1 min-w-0">
            {/* Legend row */}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3 text-xs text-muted-foreground">
              {displayOptions.map((o, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: o.color || CHART_COLORS[i % CHART_COLORS.length] }} />
                  {o.label} <span className="font-semibold text-foreground">{Math.round(o.price * 100)}%</span>
                </span>
              ))}
            </div>
            {/* Options rows - clickable */}
            <div className="space-y-0">
              {displayOptions.map((opt, idx) => {
                const pct = Math.round(opt.price * 100);
                const isSelected = selectedOptionIdx === idx;
                const optColor = opt.color || CHART_COLORS[idx % CHART_COLORS.length];
                return (
                  <div key={idx}
                    className={`flex items-center justify-between py-2 border-b border-border/40 last:border-0 cursor-pointer rounded-md px-2 transition-all ${isSelected ? 'bg-accent/50 ring-1 ring-primary' : 'hover:bg-secondary/60'}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedOptionIdx(isSelected ? null : idx); setPosition('yes'); }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: optColor }} />
                      <span className="text-sm text-foreground font-medium">{opt.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{pct < 1 ? '<1' : pct}%</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOptionIdx(isSelected ? null : idx); setPosition('yes'); }}
                        className={`text-xs font-bold px-3 py-1 rounded-md transition-all ${isSelected ? 'text-white' : 'hover:opacity-80'}`}
                        style={{ backgroundColor: isSelected ? optColor : `${optColor}20`, color: isSelected ? '#fff' : optColor }}>
                        {isSelected ? t('markets.selected') : t('markets.buy')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Bot comments */}
            <div className="mt-3 space-y-2">
              {botComments.slice(0, 2).map((bc, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Avatar className="h-5 w-5 shrink-0">
                    <AvatarFallback className="text-[9px] bg-muted">{bc.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-foreground">{bc.name}</span>
                    <p className="text-xs text-muted-foreground leading-snug">{bc.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Multi-line chart (Polymarket style) */}
          <div className="md:w-[55%]">
            <PredictionMarketChart
              data={multiChartData}
              lines={displayOptions.map((opt, idx) => ({
                key: `opt_${idx}`,
                label: opt.label,
                color: opt.color || CHART_COLORS[idx % CHART_COLORS.length],
              }))}
              height={220}
              showDates={false}
            />
          </div>
        </div>

        {/* Betting panel for selected option */}
        {selectedOptionIdx !== null && (
          <div className="mb-4 p-3 rounded-lg bg-secondary/50 border border-border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: displayOptions[selectedOptionIdx].color || CHART_COLORS[selectedOptionIdx % CHART_COLORS.length] }} />
              {t('markets.bettingOn')}: {displayOptions[selectedOptionIdx].label}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">{t('markets.amountLabel')}</span>
              <Input type="text" inputMode="decimal" value={amountStr}
                onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setAmountStr(v); }}
                className="h-8 text-sm w-24" onClick={(e) => e.stopPropagation()} />
              <div className="flex gap-1">
                {[5, 10, 25, 50].map((v) => (
                  <button key={v} onClick={(e) => { e.stopPropagation(); setAmountStr(v.toString()); }}
                    className="text-[10px] px-2 py-1 rounded bg-muted hover:bg-muted-foreground/20 text-muted-foreground transition-colors">R${v}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('markets.potentialReturn')} <span className="text-foreground font-bold">{formatBRL(amount / (displayOptions[selectedOptionIdx].price || 0.01))}</span></span>
              <span>{t('markets.profit')} <span className="text-green-500 font-bold">+{formatBRL((amount / (displayOptions[selectedOptionIdx].price || 0.01)) - amount)}</span></span>
            </div>
            <Button onClick={(e) => { e.stopPropagation(); handleTrade(); }} disabled={isPlacingBet || amount <= 0}
              className="w-full h-9 text-sm font-bold text-white"
              style={{ backgroundColor: displayOptions[selectedOptionIdx].color || CHART_COLORS[selectedOptionIdx % CHART_COLORS.length] }}>
              {isPlacingBet ? t('markets.processing') : t('markets.betAmount', { amount: formatBRL(amount), label: displayOptions[selectedOptionIdx].label })}
            </Button>
          </div>
        )}
        {renderFooter()}
      </div>
    );
  }

  // ========== CRYPTO / LIVE LAYOUT (like "Bitcoin Up or Down") ==========
  if (marketType === 'crypto') {
    const btcPrice = btcData?.currentPrice || 0;
    const btcChange = btcData?.priceChange24h || 0;
    const targetPrice = btcStartPrice || (btcData ? Math.round(btcPrice / 100) * 100 : 70000);
    const priceDiff = btcPrice - targetPrice;
    const upMultiplier = (1 / market.yesPrice).toFixed(1);
    const downMultiplier = (1 / market.noPrice).toFixed(1);

    // Format countdown mm:ss
    const countdownMin = Math.floor(btcCountdown / 60);
    const countdownSec = btcCountdown % 60;
    const countdownStr = `${countdownMin}:${String(countdownSec).padStart(2, '0')}`;

    return (
      <div>
        {renderHeader()}

        {/* Palpitano-style crypto header */}
        <div className="flex flex-wrap items-center gap-4 md:gap-8 mb-3">
          <div>
            <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">Preço Inicial</span>
            <p className="text-lg font-bold text-foreground">R$ {targetPrice.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}</p>
          </div>
          <div className="flex items-center">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              priceDiff >= 0 ? 'bg-green/15 text-green' : 'bg-red/15 text-red'
            }`}>
              {priceDiff >= 0 ? '▲' : '▼'} R$ {Math.abs(priceDiff).toFixed(0)}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold flex items-center gap-1">
              Preço Atual
              <span className="inline-flex items-center gap-0.5 text-[9px] text-green">
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
                AO VIVO
              </span>
            </span>
            <p className={`text-lg font-bold ${priceDiff >= 0 ? 'text-green' : 'text-red'}`}>
              R$ {btcPrice.toLocaleString('pt-BR', { minimumFractionDigits: 3 })}
            </p>
          </div>
          {/* Rolling countdown */}
          <div>
            <span className="text-[10px] uppercase text-muted-foreground tracking-wider font-semibold">Termina em</span>
            <p className={`text-2xl font-bold tabular-nums ${btcCountdown <= 30 ? 'text-red' : 'text-primary'}`}>
              {countdownStr}
            </p>
          </div>
        </div>

        {/* UP / DOWN buttons with multipliers */}
        <div className="flex gap-2 mb-4">
          <button onClick={(e) => { e.stopPropagation(); setPosition(position === 'yes' ? null : 'yes'); }}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all border-2 ${position === 'yes' ? 'border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]' : 'border-transparent'}`}
            style={{ backgroundColor: 'hsla(152, 69%, 45%, 0.2)', color: 'hsl(152, 69%, 55%)' }}>
            {t('markets.up', { defaultValue: 'Para Cima' })} {upMultiplier}x
          </button>
          <button onClick={(e) => { e.stopPropagation(); setPosition(position === 'no' ? null : 'no'); }}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all border-2 ${position === 'no' ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'border-transparent'}`}
            style={{ backgroundColor: 'hsla(0, 72%, 51%, 0.2)', color: 'hsl(0, 72%, 60%)' }}>
            {t('markets.down', { defaultValue: 'Para Baixo' })} {downMultiplier}x
          </button>
        </div>

        {renderBettingPanel()}

        {/* Two-column: Comments + Real BTC chart */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 min-w-0 space-y-2.5">
            {botComments.map((bc, i) => (
              <div key={i} className="flex items-start gap-2">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarFallback className="text-[9px] bg-muted">{bc.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-foreground">{bc.name}</span>
                  <p className="text-xs text-muted-foreground leading-snug">{bc.comment}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Real BTC Chart */}
          <div className="md:w-[55%]">
            {/* Interval selector pills */}
            <div className="flex gap-1 mb-2">
              {['5m', '15m', '1h', '1d'].map((iv) => (
                <button
                  key={iv}
                  onClick={(e) => { e.stopPropagation(); setBtcInterval(iv); }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${btcInterval === iv ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                  {iv.toUpperCase()}
                </button>
              ))}
            </div>
            <PredictionMarketChart
              data={liveCryptoChart}
              lines={[{ key: 'price', label: 'BTC', color: '#facc15' }]}
              height={200}
              domain={['auto', 'auto']}
              yFormatter={(v) => `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
              showDates={true}
              wsSymbol="btcusdt"
              wsTargetKey="price"
              targetPrice={targetPrice}
              targetLabel="Target"
            />
          </div>
        </div>

        {/* Footer with LIVE indicator */}
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span className="font-medium">{formatVol(market.volume)} Vol</span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 font-bold text-[10px]">{t('markets.live')}</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ========== BINARY LAYOUT (like "Will Pete Hegseth ban Claude?") ==========
  return (
    <div>
      {renderHeader()}

      {/* Chance + change */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl font-bold text-primary">{yesPercent}% {t('markets.chance')}</span>
        <span className={`text-xs font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(diff)}%
        </span>
      </div>

      {/* Yes / No buttons */}
      <div className="flex gap-2 mb-4">
        <button onClick={(e) => { e.stopPropagation(); setPosition(position === 'yes' ? null : 'yes'); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${position === 'yes' ? 'border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.3)]' : 'border-transparent'}`}
          style={{ backgroundColor: 'hsla(152, 69%, 45%, 0.2)', color: 'hsl(152, 69%, 55%)' }}>
          {yesLabel}
        </button>
        <button onClick={(e) => { e.stopPropagation(); setPosition(position === 'no' ? null : 'no'); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border-2 ${position === 'no' ? 'border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]' : 'border-transparent'}`}
          style={{ backgroundColor: 'hsla(0, 72%, 51%, 0.2)', color: 'hsl(0, 72%, 60%)' }}>
          {noLabel}
        </button>
      </div>

      {renderBettingPanel()}

      {/* Chart (Polymarket style with real data) */}
      <PredictionMarketChart
        data={binaryChartData}
        lines={[
          { key: 'pct', label: yesLabel, color: '#facc15' },
          { key: 'pctNo', label: noLabel, color: '#3b82f6' },
        ]}
        height={260}
        showDates={realHistory.length > 5}
      />

      {renderFooter()}
    </div>
  );
}
