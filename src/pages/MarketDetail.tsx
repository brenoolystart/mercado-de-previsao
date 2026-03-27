import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, TrendingUp, Clock, Users, Wallet, ChevronDown, ChevronUp, ExternalLink, Radio, BarChart3, LineChart } from 'lucide-react';
import { getImageOverride, getOptionImageSource, overrideOptionImages, getMarketImageOverride, proxyImage } from '@/lib/image-overrides';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { WalletDisplay } from '@/components/WalletDisplay';
import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { PredictionMarketChart } from '@/components/PredictionMarketChart';
import { MarketCommentSection } from '@/components/market/MarketCommentSection';
import { MobileTradeBar } from '@/components/market/MobileTradeBar';
import { useNews, type PredictionMarket } from '@/hooks/useNews';
import { useMarketHistory, useMultiMarketHistory } from '@/hooks/useMarketHistory';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';
import { usePolymarketWebSocket } from '@/hooks/usePolymarketWebSocket';
import { LiveIndicator } from '@/components/LiveIndicator';

function detectCryptoSymbol(title: string): string | null {
  const lower = title.toLowerCase();
  if (lower.includes('bitcoin') || lower.includes('btc')) return 'BTCUSDT';
  if (lower.includes('ethereum') || lower.includes('eth')) return 'ETHUSDT';
  if (lower.includes('solana') || lower.includes('sol')) return 'SOLUSDT';
  if (lower.includes('dogecoin') || lower.includes('doge')) return 'DOGEUSDT';
  if (lower.includes('xrp') || lower.includes('ripple')) return 'XRPUSDT';
  return null;
}

function formatCryptoPrice(price: number): string {
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return '$' + price.toFixed(4);
  return '$' + price.toFixed(6);
}

interface MarketOption { label: string; price: number; color?: string; icon?: string; image?: string; tokenId?: string; }

const CHART_COLORS = [
  'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(280, 87%, 65%)', 'hsl(0, 84%, 60%)',
  'hsl(217, 91%, 60%)', 'hsl(180, 70%, 45%)', 'hsl(25, 95%, 53%)', 'hsl(320, 70%, 60%)',
  'hsl(200, 98%, 39%)', 'hsl(84, 81%, 44%)'
];

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function generateHistoricalData(options: MarketOption[], marketId: string) {
  const seed = marketId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const points = 90;
  const data = [];
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - 90 * 86400;

  for (let i = 0; i < points; i++) {
    const point: any = { t: startTime + Math.floor(i * (90 * 86400) / (points - 1)) };
    options.forEach((opt, idx) => {
      const baseSeed = seed + idx * 100;
      const target = opt.price * 100;
      const start = target * 0.5 + (baseSeed % 15);
      const progress = i / (points - 1);
      const trend = start + (target - start) * Math.pow(progress, 0.7);
      const noise = Math.sin(baseSeed * 0.1 + i * 0.25) * 2.5 + Math.cos(baseSeed * 0.05 + i * 0.12) * 1.5;
      let value = trend + noise;
      value = Math.max(1, Math.min(99, value));
      point[`opt_${idx}`] = Math.round(value * 10) / 10;
    });
    data.push(point);
  }
  return data;
}

const timeRanges = ['1H', '6H', '1D', '1W', '1M', 'ALL'];

export default function MarketDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDark } = useDarkMode();
  const { isAuthenticated } = useAuthContext();
  const { wallet, placeBet, sellPosition, bets, loading: walletLoading } = useWallet();
  const { toast } = useToast();
  const { markets: allMarkets } = useNews();
  const isMobile = useIsMobile();

  const marketId = searchParams.get('id') || '0';
  const title = decodeURIComponent(searchParams.get('title') || 'Mercado de Previsão');
  const imageUrl = decodeURIComponent(searchParams.get('image') || '');
  const volume = parseInt(searchParams.get('volume') || '0');
  const optionsParam = searchParams.get('options');
  const endDate = searchParams.get('endDate') || null;

  const rawOptions: MarketOption[] = useMemo(() => {
    if (!optionsParam) return [];
    try { return JSON.parse(decodeURIComponent(optionsParam)); } catch { return []; }
  }, [optionsParam]);

  const options = useMemo(() => overrideOptionImages(rawOptions), [rawOptions]);
  const resolvedImageUrl = useMemo(() => getMarketImageOverride(title, imageUrl), [title, imageUrl]);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<'yes' | 'no'>('yes');
  const [amountStr, setAmountStr] = useState('10');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [selectedRange, setSelectedRange] = useState('ALL');
  const [showAllOptions, setShowAllOptions] = useState(false);
  const [sellAmountStr, setSellAmountStr] = useState('');
  const [mobileTradeOpen, setMobileTradeOpen] = useState(false);

  // Crypto detection for live chart
  const cryptoSymbol = useMemo(() => detectCryptoSymbol(title), [title]);
  const isCryptoMarket = !!cryptoSymbol;
  const { data: cryptoData, loading: cryptoLoading } = useBitcoinPrice(isCryptoMarket ? '5m' : '5m');
  const [chartMode, setChartMode] = useState<'area' | 'candlestick'>('area');
  const cryptoChartData = useMemo(() => {
    if (!isCryptoMarket || !cryptoData?.priceHistory) return [];
    return cryptoData.priceHistory.map((p) => ({
      t: Math.floor(p.time / 1000),
      price: p.close,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    }));
  }, [isCryptoMarket, cryptoData]);

  const amount = parseFloat(amountStr) || 0;
  const currentPrice = selectedOption !== null
    ? (selectedPosition === 'yes' ? options[selectedOption]?.price || 0.5 : 1 - (options[selectedOption]?.price || 0.5))
    : 0.5;
  const potentialReturn = amount / currentPrice;
  const profit = potentialReturn - amount;

  // User positions for this market
  const myPositions = bets.filter(b => b.market_id === marketId && b.status === 'pending');

  // Fetch history for top 5 options
  const topTokens = useMemo(() => {
    return options.slice(0, 5).map((opt, idx) => ({
      key: `opt_${idx}`,
      tokenId: opt.tokenId,
    }));
  }, [options]);

  const { histories: multiHistories, loading: multiLoading } = useMultiMarketHistory(topTokens, selectedRange);

  const selectedOptionTokenId = selectedOption !== null && selectedOption >= 5 ? options[selectedOption]?.tokenId : undefined;
  const { history: selectedOptionHistory } = useMarketHistory(selectedOptionTokenId, selectedRange);

  const chartData = useMemo(() => {
    if (selectedOption !== null && selectedOption >= 5 && selectedOptionHistory.length > 0) {
      return selectedOptionHistory.map((point) => ({
        t: point.t,
        [`opt_${selectedOption}`]: Math.round(point.p * 1000) / 10,
      }));
    }
    const hasAnyHistory = Object.values(multiHistories).some(h => h.length > 0);
    if (hasAnyHistory) {
      const timeMap = new Map<number, any>();
      Object.entries(multiHistories).forEach(([key, points]) => {
        points.forEach(p => {
          const existing = timeMap.get(p.t) || { t: p.t };
          existing[key] = Math.round(p.p * 1000) / 10;
          timeMap.set(p.t, existing);
        });
      });
      const merged = Array.from(timeMap.values()).sort((a, b) => a.t - b.t);
      if (merged.length > 0) return merged;
    }
    return generateHistoricalData(options.slice(0, 6), marketId);
  }, [marketId, options, selectedOption, selectedOptionHistory, multiHistories]);

  const relatedMarkets = useMemo(() => {
    return allMarkets.filter(m => m.id !== marketId).slice(0, 5);
  }, [allMarkets, marketId]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) setAmountStr(val);
  };

  const handleSelectOption = (idx: number, pos: 'yes' | 'no') => {
    setSelectedOption(idx);
    setSelectedPosition(pos);
    setMobileTradeOpen(true);
  };

  const handleTrade = async () => {
    if (selectedOption === null) { toast({ title: 'Selecione uma opção', variant: 'destructive' }); return; }
    if (!isAuthenticated) { toast({ title: 'Login necessário', variant: 'destructive' }); navigate('/login'); return; }
    if (!wallet) { toast({ title: 'Erro', description: 'Carteira não encontrada.', variant: 'destructive' }); return; }
    if (amount > wallet.balance) { toast({ title: 'Saldo insuficiente', variant: 'destructive' }); return; }
    if (amount <= 0) { toast({ title: 'Valor inválido', variant: 'destructive' }); return; }
    setIsPlacingBet(true);
    // Send position as 'yes' or 'no', with market_title including the option label
    const positionLabel = selectedPosition;
    const marketTitleWithOption = `${title} — ${options[selectedOption].label}`;
    const result = await placeBet(marketId, marketTitleWithOption, positionLabel, amount, currentPrice);
    setIsPlacingBet(false);
    if (result.success) {
      toast({ title: 'Palpite registrado!', description: `${formatBRL(amount)} em "${options[selectedOption].label}" (${selectedPosition === 'yes' ? 'Sim' : 'Não'}).` });
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  };

  const handleSell = async (betId: string, sellAmt: number) => {
    if (!isAuthenticated) { toast({ title: 'Login necessário', variant: 'destructive' }); navigate('/login'); return; }
    if (sellAmt <= 0) { toast({ title: 'Valor inválido', variant: 'destructive' }); return; }
    setIsSelling(true);
    const result = await sellPosition(betId, sellAmt);
    setIsSelling(false);
    if (result.success) {
      toast({ title: 'Posição vendida!', description: `Você recebeu ${formatBRL(result.sellValue || 0)}.` });
      setSellAmountStr('');
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  };

  const visibleOptions = showAllOptions ? options : options.slice(0, 8);
  const hasMoreOptions = options.length > 8;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="container">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
              <Link to="/" className="shrink-0"><img src={isDark ? logoDark : logoLight} alt="OnChoice" className="h-7 md:h-8" /></Link>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isAuthenticated ? <WalletDisplay /> : (
                <><Button variant="outline" size="sm" asChild><Link to="/login">Entrar</Link></Button><Button size="sm" asChild><Link to="/signup">Cadastrar</Link></Button></>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title section */}
            <div className="flex items-start gap-3 md:gap-4">
              {resolvedImageUrl && <img src={proxyImage(resolvedImageUrl)} alt="" className="w-11 h-11 md:w-14 md:h-14 rounded-xl object-cover border border-border shrink-0" />}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-foreground leading-tight">{title}</h1>
                {/* Legend dots */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {options.slice(0, 5).map((opt, idx) => {
                    const color = opt.color || CHART_COLORS[idx % CHART_COLORS.length];
                    return (
                      <span key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-foreground font-medium">{opt.label}</span>
                        <span>{Math.round(opt.price * 100)}%</span>
                      </span>
                    );
                  })}
                </div>
                {endDate && <CountdownTimer endDate={endDate} className="mt-3" />}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)} className={isFavorite ? 'text-yellow-500' : ''}>
                  <Star className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Live Crypto Price Chart (for crypto markets) */}
            {isCryptoMarket && cryptoChartData.length > 0 && (
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Preço em Tempo Real</p>
                    {cryptoData && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-lg md:text-2xl font-bold text-foreground tabular-nums">
                          {formatCryptoPrice(cryptoData.currentPrice)}
                        </span>
                        <span className={`text-sm font-semibold ${cryptoData.priceChange24h >= 0 ? 'text-green' : 'text-red'}`}>
                          {cryptoData.priceChange24h >= 0 ? '+' : ''}{cryptoData.priceChange24h.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-secondary/60 rounded-lg p-0.5">
                      <button
                        onClick={() => setChartMode('area')}
                        className={`p-1.5 rounded-md transition-colors ${
                          chartMode === 'area' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="Gráfico de Área"
                      >
                        <LineChart className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setChartMode('candlestick')}
                        className={`p-1.5 rounded-md transition-colors ${
                          chartMode === 'candlestick' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="Candlestick"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3 h-3 text-red animate-pulse" />
                      <span className="text-[11px] font-semibold text-red">AO VIVO</span>
                    </div>
                  </div>
                </div>
                <div className="w-full">
                  <PredictionMarketChart
                    data={cryptoChartData}
                    lines={[{ key: 'price', label: cryptoSymbol?.replace('USDT', '') || 'BTC', color: '#f59e0b' }]}
                    height={isMobile ? 180 : 250}
                    showDates={true}
                    domain={['auto', 'auto']}
                    yFormatter={(v) => formatCryptoPrice(v)}
                    chartType={chartMode}
                  />
                </div>
              </div>
            )}

            {/* Prediction Chart — hide for crypto markets that already show price chart */}
            {!isCryptoMarket && <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Gráfico de Probabilidades</p>
                  {Object.values(multiHistories).some(h => h.length > 0) || (selectedOption !== null && selectedOptionHistory.length > 0) ? (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-lg md:text-2xl font-bold text-foreground tabular-nums">
                        {selectedOption !== null ? Math.round(options[selectedOption]?.price * 100) : Math.round(options[0]?.price * 100)}%
                      </span>
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                        AO VIVO
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">Histórico de preços</p>
                  )}
                </div>
              </div>

              {/* Time range pills */}
              <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto">
                {timeRanges.map(range => (
                  <button
                    key={range}
                    onClick={() => setSelectedRange(range)}
                    className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors shrink-0 ${
                      selectedRange === range
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="w-full">
                <PredictionMarketChart
                  data={chartData}
                  lines={(selectedOption !== null && selectedOption >= 5 && selectedOptionHistory.length > 0
                    ? [options[selectedOption]].filter(Boolean).map((opt) => ({
                        key: `opt_${selectedOption}`,
                        label: opt.label,
                        color: opt.color || CHART_COLORS[selectedOption! % CHART_COLORS.length],
                      }))
                    : options.slice(0, 5).map((opt, idx) => ({
                        key: `opt_${idx}`,
                        label: opt.label,
                        color: opt.color || CHART_COLORS[idx % CHART_COLORS.length],
                      }))
                  )}
                  height={isMobile ? 220 : 320}
                  showDates={true}
                />
              </div>

              {/* Stats footer */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-border text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />R${formatNumber(volume)} Vol.</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{Math.floor(volume / 100)} traders</span>
              </div>
            </div>}

            {/* Options list */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {visibleOptions.map((option, idx) => {
                const color = option.color || CHART_COLORS[idx % CHART_COLORS.length];
                const percent = Math.round(option.price * 100);
                const noPercent = 100 - percent;
                const yesPrice = (percent / 100).toFixed(2);
                const noPrice = (noPercent / 100).toFixed(2);
                const optionImage = getOptionImageSource(option, resolvedImageUrl);
                return (
                  <div key={idx} className={`px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${selectedOption === idx ? 'bg-primary/5' : ''}`}>
                    <div className="flex items-center gap-3">
                      {optionImage ? (
                        <>
                          <img src={proxyImage(optionImage)} alt={option.label} className="w-9 h-9 rounded-full object-cover shrink-0 border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; const fb = (e.target as HTMLElement).nextElementSibling as HTMLElement; if (fb) fb.style.display = 'flex'; }} />
                          <div className="w-9 h-9 rounded-full shrink-0 items-center justify-center text-white text-xs font-bold" style={{ display: 'none', backgroundColor: color }}>{option.label.charAt(0).toUpperCase()}</div>
                        </>
                      ) : (
                        <div className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>
                          {option.label.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground block truncate">{option.label}</span>
                        <span className="text-xs text-muted-foreground">R${formatNumber(Math.floor(volume * option.price / 2))} Vol.</span>
                      </div>
                      <span className="text-lg md:text-2xl font-bold text-foreground tabular-nums shrink-0">{percent < 1 ? '<1' : percent}%</span>
                    </div>
                    {/* Buy Yes / Buy No buttons */}
                    <div className="flex items-center gap-2 mt-2 ml-12">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectOption(idx, 'yes'); }}
                        className="flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors text-center"
                        style={{
                          color: 'hsl(152, 69%, 45%)',
                          borderColor: 'hsla(152, 69%, 45%, 0.3)',
                          backgroundColor: selectedOption === idx && selectedPosition === 'yes' ? 'hsla(152, 69%, 45%, 0.15)' : 'transparent'
                        }}
                      >
                        Sim R${yesPrice}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectOption(idx, 'no'); }}
                        className="flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors text-center"
                        style={{
                          color: 'hsl(0, 72%, 55%)',
                          borderColor: 'hsla(0, 72%, 55%, 0.3)',
                          backgroundColor: selectedOption === idx && selectedPosition === 'no' ? 'hsla(0, 72%, 55%, 0.15)' : 'transparent'
                        }}
                      >
                        Não R${noPrice}
                      </button>
                    </div>
                  </div>
                );
              })}
              {hasMoreOptions && (
                <button onClick={() => setShowAllOptions(!showAllOptions)} className="w-full flex items-center justify-center gap-1 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors border-t border-border">
                  {showAllOptions ? (<><ChevronUp className="w-4 h-4" />Ver menos</>) : (<><ChevronDown className="w-4 h-4" />+{options.length - 8} opções</>)}
                </button>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="comments">
              <TabsList className="w-full overflow-x-auto flex">
                <TabsTrigger value="comments" className="flex-1 min-w-[80px]">Discussão</TabsTrigger>
                <TabsTrigger value="positions" className="flex-1 min-w-[80px]">Posições</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1 min-w-[80px]">Atividade</TabsTrigger>
                <TabsTrigger value="about" className="flex-1 min-w-[80px]">Regras</TabsTrigger>
              </TabsList>
              <TabsContent value="comments" className="mt-4"><MarketCommentSection marketId={marketId} /></TabsContent>
              <TabsContent value="positions" className="mt-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  {!isAuthenticated ? (
                    <p className="text-muted-foreground text-center text-sm py-6">
                      <Link to="/login" className="text-primary hover:underline">Faça login</Link> para ver suas posições neste mercado.
                    </p>
                  ) : myPositions.length === 0 ? (
                    <p className="text-muted-foreground text-center text-sm py-6">Você não possui posições neste mercado.</p>
                  ) : (
                    <div className="space-y-3">
                      {myPositions.map((bet) => {
                        const isYes = bet.position === 'yes';
                        const betAmount = Number(bet.amount);
                        const pnl = (isYes ? (options[0]?.price || 0.5) : (1 - (options[0]?.price || 0.5))) * (betAmount / Number(bet.price_at_bet)) - betAmount;
                        const roi = ((isYes ? (options[0]?.price || 0.5) : (1 - (options[0]?.price || 0.5))) / Number(bet.price_at_bet) - 1) * 100;
                        const sellAmt = parseFloat(sellAmountStr) || 0;
                        const estimatedReturn = Math.min(sellAmt, betAmount) * 0.95;
                        return (
                          <div key={bet.id} className="border border-border rounded-xl p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: isYes ? 'hsl(152, 69%, 45%)' : 'hsl(0, 72%, 55%)' }} />
                                <span className="text-sm font-bold text-foreground">{bet.market_title}</span>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: pnl >= 0 ? 'hsla(152, 69%, 45%, 0.15)' : 'hsla(0, 72%, 51%, 0.15)', color: pnl >= 0 ? 'hsl(152, 69%, 50%)' : 'hsl(0, 72%, 60%)' }}>
                                {pnl >= 0 ? '+' : ''}{formatBRL(pnl)} ({roi >= 0 ? '+' : ''}{roi.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div><span className="text-muted-foreground block">Investido</span><span className="font-bold text-foreground">{formatBRL(betAmount)}</span></div>
                              <div><span className="text-muted-foreground block">Shares</span><span className="font-bold text-foreground">{(betAmount / Number(bet.price_at_bet)).toFixed(2)}</span></div>
                              <div><span className="text-muted-foreground block">Preço médio</span><span className="font-bold text-foreground">R${Number(bet.price_at_bet).toFixed(2)}</span></div>
                            </div>
                            {/* Sell section */}
                            <div>
                              <div className="flex items-baseline justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Valor para vender</span>
                                <button onClick={() => setSellAmountStr(String(betAmount))} className="text-[10px] text-primary font-semibold hover:underline">Vender tudo</button>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-baseline gap-1 flex-1">
                                  <span className="text-muted-foreground text-sm font-semibold">R$</span>
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    value={sellAmountStr}
                                    onChange={(e) => { const v = e.target.value; if (v === '' || /^\d*\.?\d*$/.test(v)) setSellAmountStr(v); }}
                                    placeholder="0"
                                    className="bg-transparent text-lg font-bold text-foreground outline-none w-20 tabular-nums placeholder:text-muted-foreground/30"
                                  />
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleSell(bet.id, Math.min(sellAmt || betAmount, betAmount))}
                                  disabled={isSelling || walletLoading || sellAmt <= 0}
                                  style={{ backgroundColor: 'hsl(0, 72%, 55%)', color: '#fff' }}
                                >
                                  {isSelling ? 'Vendendo...' : 'Vender'}
                                </Button>
                              </div>
                              {sellAmt > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">Você recebe (taxa 5%): <span className="font-bold" style={{ color: 'hsl(152, 69%, 50%)' }}>{formatBRL(estimatedReturn)}</span></p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="activity" className="mt-4"><div className="bg-card border border-border rounded-xl p-6"><p className="text-muted-foreground text-center text-sm">Nenhuma atividade recente.</p></div></TabsContent>
              <TabsContent value="about" className="mt-4">
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <div className="border-b border-border">
                    <div className="flex">
                      <span className="px-4 py-2.5 text-sm font-semibold text-foreground border-b-2 border-primary">Regras</span>
                      <span className="px-4 py-2.5 text-sm text-muted-foreground">Contexto de Mercado</span>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Este mercado possui <strong className="text-foreground">{options.length} opções</strong> de resultado.
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Critérios de Resolução</h4>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>A resolução é baseada em fontes oficiais.</li>
                        <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>A opção vencedora recebe R$1,00 por contrato.</li>
                        <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Pagamentos processados automaticamente.</li>
                        {endDate && <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Data limite: <strong className="text-foreground">{new Date(endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></li>}
                      </ul>
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Opções Disponíveis</h4>
                      <div className="space-y-1">
                        {options.slice(0, 10).map((opt, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm py-1">
                            <span className="flex items-center gap-2 text-foreground">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: opt.color || CHART_COLORS[idx % CHART_COLORS.length] }} />
                              {opt.label}
                            </span>
                            <span className="text-muted-foreground font-medium">{Math.round(opt.price * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - desktop only */}
          <div className="hidden lg:block lg:col-span-1 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
              {selectedOption !== null && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                  {(() => {
                    const selectedImage = getOptionImageSource(options[selectedOption], resolvedImageUrl);
                    return selectedImage ? (
                      <img src={proxyImage(selectedImage)} alt={options[selectedOption].label} className="w-10 h-10 rounded-full object-cover border border-border" />
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: options[selectedOption]?.color || CHART_COLORS[selectedOption % CHART_COLORS.length] }}>
                        {options[selectedOption]?.label.charAt(0).toUpperCase()}
                      </div>
                    );
                  })()}
                  <span className="font-bold text-foreground">{options[selectedOption]?.label}</span>
                </div>
              )}

              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-foreground">Comprar</h3>
                {wallet && <span className="text-xs text-muted-foreground">{formatBRL(wallet.balance)}</span>}
              </div>

              {/* Yes/No buttons */}
              {selectedOption !== null && (
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => setSelectedPosition('yes')}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: selectedPosition === 'yes' ? 'hsl(152, 69%, 45%)' : 'hsla(152, 69%, 45%, 0.12)',
                      color: selectedPosition === 'yes' ? '#fff' : 'hsl(152, 69%, 50%)',
                    }}
                  >
                    Sim R${(options[selectedOption].price).toFixed(2)}
                  </button>
                  <button
                    onClick={() => setSelectedPosition('no')}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all"
                    style={{
                      backgroundColor: selectedPosition === 'no' ? 'hsl(0, 72%, 55%)' : 'hsla(0, 72%, 51%, 0.12)',
                      color: selectedPosition === 'no' ? '#fff' : 'hsl(0, 72%, 60%)',
                    }}
                  >
                    Não R${(1 - options[selectedOption].price).toFixed(2)}
                  </button>
                </div>
              )}

              {/* Amount */}
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Quantidade</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg text-muted-foreground font-medium">R$</span>
                  <Input type="text" inputMode="decimal" value={amountStr} onChange={handleAmountChange} onBlur={() => { if (amountStr === '' || amount <= 0) setAmountStr('10'); }} className="pl-11 text-lg h-12 font-semibold" />
                </div>
                <div className="flex gap-1.5 mt-2">
                  {[10, 50, 100, 250].map((val) => (
                    <button key={val} onClick={() => setAmountStr(String(val))} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-secondary hover:bg-muted transition-colors">+R${val}</button>
                  ))}
                  <button onClick={() => wallet && setAmountStr(String(Math.floor(wallet.balance)))} className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-secondary hover:bg-muted transition-colors">Max</button>
                </div>
              </div>

              {/* Order stats */}
              {selectedOption !== null && amount > 0 && (
                <div className="bg-secondary/50 rounded-lg p-3 mb-4 space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Shares</span><span className="text-foreground font-semibold">{(amount / currentPrice).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Preço</span><span className="text-foreground font-semibold">R${currentPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Retorno</span><span className="text-foreground font-semibold" style={{ color: 'hsl(152, 69%, 50%)' }}>{formatBRL(potentialReturn)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">ROI</span><span className="font-semibold" style={{ color: 'hsl(152, 69%, 50%)' }}>+{((potentialReturn / amount - 1) * 100).toFixed(1)}%</span></div>
                </div>
              )}

              <Button className="w-full h-11 text-sm font-semibold" onClick={handleTrade} disabled={isPlacingBet || walletLoading || selectedOption === null}
                style={{ backgroundColor: selectedPosition === 'yes' ? 'hsl(152, 69%, 45%)' : 'hsl(0, 72%, 55%)', color: '#fff' }}
              >
                {isPlacingBet ? 'Processando...' : selectedOption !== null ? `Palpitar ${selectedPosition === 'yes' ? 'Sim' : 'Não'}` : 'Selecione uma opção'}
              </Button>

              {!isAuthenticated && <p className="text-xs text-muted-foreground text-center mt-3">Você precisa <Link to="/login" className="text-primary hover:underline">entrar</Link> para palpitar</p>}
            </div>

            {/* Related markets */}
            {relatedMarkets.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="text-sm font-bold text-foreground mb-3">Mercados relacionados</h4>
                <div className="space-y-3">
                  {relatedMarkets.map((m) => {
                    const pct = Math.round(m.yesPrice * 100);
                    return (
                      <Link key={m.id}
                        to={m.isMultiOption && m.options?.length
                          ? `/market-detail?id=${m.id}&title=${encodeURIComponent(m.question)}&image=${encodeURIComponent(m.imageUrl)}&volume=${m.volume}&options=${encodeURIComponent(JSON.stringify(m.options))}`
                          : `/market?id=${m.id}&title=${encodeURIComponent(m.question)}&yes=${m.yesPrice}&image=${encodeURIComponent(m.imageUrl)}`}
                        className="flex items-center gap-3 hover:bg-secondary/40 rounded-lg p-2 -mx-2 transition-colors"
                      >
                        <img src={proxyImage(m.imageUrl)} alt="" className="w-8 h-8 rounded-full object-cover bg-secondary shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        <span className="text-xs text-foreground flex-1 min-w-0 line-clamp-2 leading-snug">{m.question}</span>
                        <span className="text-sm font-bold text-foreground shrink-0">{pct}%</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile trade bar — controlled open */}
      <MobileTradeBar
        marketId={marketId}
        title={title}
        imageUrl={imageUrl || undefined}
        yesPrice={selectedOption !== null ? options[selectedOption]?.price || 0.5 : options[0]?.price || 0.5}
        yesLabel="Sim"
        noLabel="Não"
        selectedOptionLabel={selectedOption !== null ? options[selectedOption]?.label : undefined}
        selectedOptionImage={selectedOption !== null ? options[selectedOption]?.image : undefined}
        selectedOptionPrice={selectedOption !== null ? options[selectedOption]?.price : undefined}
        isOpen={mobileTradeOpen}
        onOpenChange={setMobileTradeOpen}
        initialPosition={selectedPosition}
      />
    </div>
  );
}
