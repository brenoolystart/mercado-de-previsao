import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, TrendingUp, Users, Wallet, Radio, BarChart3, LineChart } from 'lucide-react';
import { proxyImage } from '@/lib/image-overrides';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { WalletDisplay } from '@/components/WalletDisplay';
import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';
import { PredictionMarketChart } from '@/components/PredictionMarketChart';
import { MarketCommentSection } from '@/components/market/MarketCommentSection';
import { OrderBook } from '@/components/market/OrderBook';
import { MobileTradeBar } from '@/components/market/MobileTradeBar';
import { CountdownTimer } from '@/components/CountdownTimer';
import { useNews } from '@/hooks/useNews';
import { useMarketHistory } from '@/hooks/useMarketHistory';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBitcoinPrice } from '@/hooks/useBitcoinPrice';
import { usePolymarketWebSocket } from '@/hooks/usePolymarketWebSocket';
import { LiveIndicator } from '@/components/LiveIndicator';

/* ── Crypto detection helpers ── */
function detectCryptoSymbol(title: string): string | null {
  const lower = title.toLowerCase();
  if (lower.includes('bitcoin') || lower.includes('btc')) return 'BTCUSDT';
  if (lower.includes('ethereum') || lower.includes('eth')) return 'ETHUSDT';
  if (lower.includes('solana') || lower.includes('sol')) return 'SOLUSDT';
  if (lower.includes('dogecoin') || lower.includes('doge')) return 'DOGEUSDT';
  if (lower.includes('xrp') || lower.includes('ripple')) return 'XRPUSDT';
  if (lower.includes('cardano') || lower.includes('ada')) return 'ADAUSDT';
  return null;
}

function extractTargetPrice(title: string): number | null {
  // Match patterns like "$69,802" or "$70,000" or "69802" or "69.802"
  const patterns = [
    /\$\s?([\d,]+(?:\.\d+)?)/,
    /(\d{2,6}[,.]?\d{0,3})\s*(?:usd|dollars?)?/i,
  ];
  for (const p of patterns) {
    const m = title.match(p);
    if (m) {
      const num = parseFloat(m[1].replace(/,/g, ''));
      if (num > 100) return num; // reasonable crypto price
    }
  }
  return null;
}

function isCryptoUpDown(title: string): boolean {
  const lower = title.toLowerCase();
  const hasCrypto = /bitcoin|btc|ethereum|eth|solana|sol|dogecoin|doge|xrp|cardano|ada/i.test(lower);
  const hasUpDown = /up\s*(or|\/)\s*down|para\s*cima|para\s*baixo|above|below|acima|abaixo|higher|lower/i.test(lower);
  return hasCrypto && hasUpDown;
}

function formatCryptoPrice(price: number): string {
  if (price >= 1000) return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return '$' + price.toFixed(4);
  return '$' + price.toFixed(6);
}

function detectCryptoInterval(title: string): string {
  const lower = title.toLowerCase();
  if (/5\s*min/i.test(lower)) return '5m';
  if (/15\s*min/i.test(lower)) return '15m';
  if (/1\s*h|hourl|1\s*hora/i.test(lower)) return '1h';
  return '5m';
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function generateBinaryChartData(yesPrice: number, marketId: string) {
  // Deterministic seed from market ID
  const seed = marketId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const points = 180; // more data points = smoother line
  const data = [];
  const targetYes = yesPrice * 100;
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - 90 * 86400;

  // Seeded pseudo-random
  let rng = seed;
  const nextRng = () => { rng = (rng * 16807 + 0) % 2147483647; return (rng & 0x7fffffff) / 2147483647; };

  // Start price — somewhere between 30-70% biased toward current
  const startYes = 30 + nextRng() * 40;
  let yes = startYes;

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    // Gentle drift toward target price
    const drift = (targetYes - yes) * 0.015;
    // Random walk with mean reversion
    const randomWalk = (nextRng() - 0.5) * 3.5;
    // Occasional larger moves (simulates news events)
    const spike = nextRng() > 0.92 ? (nextRng() - 0.5) * 8 : 0;
    // Momentum
    const momentum = i > 0 ? (yes - (data[i - 1]?.yes || yes)) * 0.3 : 0;

    yes = yes + drift + randomWalk + spike + momentum;
    // At the very end, converge strongly to target
    if (progress > 0.85) {
      yes = yes + (targetYes - yes) * (progress - 0.85) * 3;
    }
    yes = Math.max(1, Math.min(99, yes));

    const t = startTime + Math.floor(i * (90 * 86400) / (points - 1));
    data.push({ t, yes: Math.round(yes * 10) / 10, no: Math.round((100 - yes) * 10) / 10 });
  }
  return data;
}

const timeRanges = ['1H', '6H', '1D', '1W', '1M', 'ALL'];

// ChartTooltip removed — handled by PredictionMarketChart

export default function Market() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { marketId: pathMarketId } = useParams<{ marketId: string }>();
  const { isDark } = useDarkMode();
  const { isAuthenticated } = useAuthContext();
  const { wallet, placeBet, sellPosition, bets, loading: walletLoading } = useWallet();
  const { toast } = useToast();
  const { markets: allMarkets } = useNews();
  const isMobile = useIsMobile();

  // Support both /market?id=X and /market/X
  const resolvedId = pathMarketId || searchParams.get('id') || '0';
  const foundMarket = allMarkets.find(m => m.id === resolvedId);

  const marketId = resolvedId;
  const title = searchParams.get('title') || foundMarket?.question || 'Mercado de Previsão';
  const yesPrice = parseFloat(searchParams.get('yes') || '') || foundMarket?.yesPrice || 0.5;
  const noPrice = 1 - yesPrice;
  const imageUrl = searchParams.get('image') || foundMarket?.imageUrl || '';
  const endDate = searchParams.get('endDate') || foundMarket?.endDate || null;
  const volume = parseInt(searchParams.get('volume') || '') || foundMarket?.volume || 1200000;

  let outcomeLabels: string[] | undefined;
  try {
    const labelsParam = searchParams.get('outcomeLabels');
    if (labelsParam) outcomeLabels = JSON.parse(decodeURIComponent(labelsParam));
  } catch { /* ignore */ }
  if (!outcomeLabels && foundMarket?.outcomeLabels) outcomeLabels = foundMarket.outcomeLabels;

  let tokenId: string | undefined;
  try {
    const tokenParam = searchParams.get('tokenId');
    if (tokenParam) tokenId = decodeURIComponent(tokenParam);
  } catch { /* ignore */ }
  if (!tokenId && foundMarket?.clobTokenIds?.[0]) tokenId = foundMarket.clobTokenIds[0];

  const yesLabel = outcomeLabels?.[0] || 'Sim';
  const noLabel = outcomeLabels?.[1] || 'Não';

  const [position, setPosition] = useState<'yes' | 'no'>('yes');
  const [amountStr, setAmountStr] = useState('10');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isSelling, setIsSelling] = useState(false);
  const [selectedRange, setSelectedRange] = useState('ALL');
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [sellAmountStr, setSellAmountStr] = useState('');
  const [mobileTradeOpen, setMobileTradeOpen] = useState(false);
  const [chartMode, setChartMode] = useState<'area' | 'candlestick'>('area');

  // Get user's positions for this market
  const myPositions = bets.filter(b => b.market_id === marketId && b.status === 'pending');
  const holderUserIds = useMemo(() => new Set(myPositions.map(b => b.user_id)), [myPositions]);

  // Crypto detection
  const decodedTitle = decodeURIComponent(title);
  const isCrypto = isCryptoUpDown(decodedTitle);
  const cryptoSymbol = useMemo(() => detectCryptoSymbol(decodedTitle), [decodedTitle]);
  const targetPrice = useMemo(() => extractTargetPrice(decodedTitle), [decodedTitle]);
  const cryptoInterval = useMemo(() => detectCryptoInterval(decodedTitle), [decodedTitle]);
  const { data: cryptoData, loading: cryptoLoading, countdown, startPrice } = useBitcoinPrice(isCrypto ? cryptoInterval : '5m');

  // Polymarket WebSocket for real-time probability updates
  const wsAssetIds = useMemo(() => {
    if (isCrypto) return []; // crypto uses Binance WS
    const ids: string[] = [];
    if (tokenId) ids.push(tokenId);
    return ids;
  }, [tokenId, isCrypto]);
  const { getPrice: getWSPrice, connected: wsConnected, getHistory: getWSHistory } = usePolymarketWebSocket(wsAssetIds);

  // Live price from WebSocket (overrides static)
  const liveYesPrice = useMemo(() => {
    if (tokenId) {
      const wsPrice = getWSPrice(tokenId);
      if (wsPrice != null) return wsPrice;
    }
    return yesPrice;
  }, [tokenId, getWSPrice, yesPrice]);
  const liveNoPrice = 1 - liveYesPrice;

  // Multiplier calculation for crypto markets
  const yesMultiplier = liveYesPrice > 0 ? (1 / liveYesPrice) : 1;
  const noMultiplier = liveNoPrice > 0 ? (1 / liveNoPrice) : 1;

  const amount = parseFloat(amountStr) || 0;
  const currentPrice = position === 'yes' ? liveYesPrice : liveNoPrice;
  const potentialReturn = amount / currentPrice;
  const profit = potentialReturn - amount;

  // Fetch real price history from Polymarket CLOB API
  const { history: realHistory, loading: historyLoading } = useMarketHistory(tokenId, selectedRange);

  // Build crypto chart data from Binance
  const cryptoChartData = useMemo(() => {
    if (!cryptoData?.priceHistory) return [];
    return cryptoData.priceHistory.map((p) => ({
      t: Math.floor(p.time / 1000),
      price: p.close,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    }));
  }, [cryptoData]);

  const chartData = useMemo(() => {
    // Merge WebSocket ticks into chart data for real-time line movement
    const wsHistory = tokenId ? getWSHistory(tokenId) : [];

    if (realHistory.length > 0) {
      const base = realHistory.map((point) => ({
        t: point.t,
        yes: Math.round(point.p * 1000) / 10,
        no: Math.round((1 - point.p) * 1000) / 10,
      }));
      // Append WS ticks that are newer than last historical point
      const lastHistTime = base[base.length - 1]?.t || 0;
      const wsTicks = wsHistory
        .filter(tick => Math.floor(tick.time / 1000) > lastHistTime)
        .map(tick => ({
          t: Math.floor(tick.time / 1000),
          yes: Math.round(tick.price * 1000) / 10,
          no: Math.round((1 - tick.price) * 1000) / 10,
        }));
      return [...base, ...wsTicks];
    }
    // Fallback to synthetic with realistic timestamps
    return generateBinaryChartData(liveYesPrice, marketId);
  }, [realHistory, liveYesPrice, marketId, tokenId, getWSHistory]);

  // Related markets - filter by same category for relevance
  const categoryFromUrl = searchParams.get('category') || '';
  const currentCategory = useMemo(() => {
    if (categoryFromUrl) return categoryFromUrl;
    const market = allMarkets.find(m => m.id === marketId);
    return market?.category || '';
  }, [allMarkets, marketId, categoryFromUrl]);

  const relatedMarkets = useMemo(() => {
    if (!currentCategory) return allMarkets.filter(m => m.id !== marketId).slice(0, 5);
    // Related categories map for better matching
    const relatedCategories: Record<string, string[]> = {
      world: ['geopolitics', 'politics'],
      geopolitics: ['world', 'politics'],
      politics: ['geopolitics', 'world'],
      crypto: ['finance', 'economy'],
      finance: ['economy', 'crypto'],
      economy: ['finance', 'crypto'],
      sports: ['culture'],
      culture: ['sports'],
      tech: ['crypto'],
    };
    const related = relatedCategories[currentCategory] || [];
    const sameCat = allMarkets.filter(m => m.id !== marketId && m.category === currentCategory);
    const nearCat = allMarkets.filter(m => m.id !== marketId && m.category !== currentCategory && related.includes(m.category));
    const combined = [...sameCat, ...nearCat];
    if (combined.length >= 2) return combined.slice(0, 5);
    const others = allMarkets.filter(m => m.id !== marketId && !combined.includes(m)).slice(0, 5 - combined.length);
    return [...combined, ...others];
  }, [allMarkets, marketId, currentCategory]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) setAmountStr(val);
  };

  const handleTrade = async () => {
    if (!isAuthenticated) { toast({ title: 'Login necessário', variant: 'destructive' }); navigate('/login'); return; }
    if (!wallet) { toast({ title: 'Erro', description: 'Carteira não encontrada.', variant: 'destructive' }); return; }
    if (amount > wallet.balance) { toast({ title: 'Saldo insuficiente', variant: 'destructive' }); return; }
    if (amount <= 0) { toast({ title: 'Valor inválido', variant: 'destructive' }); return; }
    setIsPlacingBet(true);
    const result = await placeBet(marketId, decodeURIComponent(title), position, amount, currentPrice);
    setIsPlacingBet(false);
    if (result.success) { toast({ title: 'Palpite registrado!', description: `${formatBRL(amount)} em ${position === 'yes' ? yesLabel : noLabel}.` }); }
    else { toast({ title: 'Erro', description: result.error, variant: 'destructive' }); }
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

  const yesPercent = Math.round(liveYesPrice * 100);
  const noPercent = Math.round(liveNoPrice * 100);

  return (
    <div className="min-h-screen bg-background pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="container">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
              <Link to="/"><img src={isDark ? logoDark : logoLight} alt="OnChoice" className="h-8" /></Link>
            </div>
            <div className="flex items-center gap-2">
              {isAuthenticated ? <WalletDisplay /> : (
                <><Button variant="outline" size="sm" asChild><Link to="/login">Entrar</Link></Button><Button size="sm" asChild><Link to="/signup">Cadastrar</Link></Button></>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Title section */}
            <div className="flex items-start gap-4">
              {imageUrl && <img src={proxyImage(decodeURIComponent(imageUrl))} alt="" className="w-14 h-14 rounded-xl object-cover border border-border shrink-0" />}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">{decodedTitle}</h1>
                {/* Crypto: show live price + target + countdown */}
                {isCrypto && cryptoData ? (
                  <div className="flex flex-wrap items-center gap-4 mt-2">
                    {targetPrice && (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Preço a ser batido</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          {formatCryptoPrice(targetPrice)}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Preço Atual</span>
                      <span className={`text-lg font-bold tabular-nums ${
                        startPrice && cryptoData.currentPrice > startPrice ? 'text-green' : 'text-red'
                      }`}>
                        {formatCryptoPrice(cryptoData.currentPrice)}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Termina em</span>
                      <span className="text-lg font-bold text-foreground tabular-nums">
                        {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
                      </span>
                    </div>
                    <LiveIndicator connected={true} size="md" label="AO VIVO" />
                  </div>
                ) : (
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentCategory === 'crypto' ? '#facc15' : 'hsl(152, 69%, 45%)' }} />
                      <span className="text-foreground font-medium">{yesLabel}</span>
                      <span className="tabular-nums">{yesPercent}%</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'hsl(0, 72%, 55%)' }} />
                      <span className="text-foreground font-medium">{noLabel}</span>
                      <span className="tabular-nums">{noPercent}%</span>
                    </span>
                    {wsConnected && <LiveIndicator connected={wsConnected} size="sm" label="LIVE" />}
                  </div>
                )}
                {endDate && <CountdownTimer endDate={endDate} className="mt-3" />}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)} className={isFavorite ? 'text-yellow-500' : ''}>
                <Star className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Crypto Up/Down buttons with multipliers */}
            {isCrypto && (
              <div className="flex gap-3">
                <button
                  onClick={() => { setPosition('yes'); setMobileTradeOpen(true); }}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all border-2"
                  style={{
                    backgroundColor: position === 'yes' ? 'hsl(152, 69%, 45%)' : 'transparent',
                    borderColor: 'hsl(152, 69%, 45%)',
                    color: position === 'yes' ? '#fff' : 'hsl(152, 69%, 50%)',
                  }}
                >
                  PARA CIMA {yesMultiplier.toFixed(2)}x
                </button>
                <button
                  onClick={() => { setPosition('no'); setMobileTradeOpen(true); }}
                  className="flex-1 py-3.5 rounded-xl font-bold text-sm transition-all border-2"
                  style={{
                    backgroundColor: position === 'no' ? 'hsl(0, 72%, 55%)' : 'transparent',
                    borderColor: 'hsl(0, 72%, 55%)',
                    color: position === 'no' ? '#fff' : 'hsl(0, 72%, 60%)',
                  }}
                >
                  PARA BAIXO {noMultiplier.toFixed(2)}x
                </button>
              </div>
            )}

            {/* Chart */}
            <div className="bg-card border border-border rounded-xl p-4">
              {isCrypto && cryptoChartData.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />R${formatNumber(volume)} Vol.</span>
                      {cryptoData && (
                        <span className={`font-semibold ${cryptoData.priceChange24h >= 0 ? 'text-green' : 'text-red'}`}>
                          {cryptoData.priceChange24h >= 0 ? '+' : ''}{cryptoData.priceChange24h.toFixed(2)}% 24h
                        </span>
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
                  <PredictionMarketChart
                    data={cryptoChartData}
                    lines={[{ key: 'price', label: cryptoSymbol?.replace('USDT', '') || 'BTC', color: '#f59e0b' }]}
                    height={isMobile ? 220 : 350}
                    showDates={true}
                    domain={['auto', 'auto']}
                    yFormatter={(v) => formatCryptoPrice(v)}
                    targetPrice={targetPrice || undefined}
                    targetLabel="Target"
                    chartType={chartMode}
                  />
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />R${formatNumber(volume)} Vol.</span>
                      <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{formatNumber(Math.floor(volume / 100))} participantes</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {timeRanges.map(range => (
                        <button
                          key={range}
                          onClick={() => setSelectedRange(range)}
                          className={`px-3 py-1.5 text-[11px] font-semibold rounded-full transition-colors ${
                            selectedRange === range
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                  <PredictionMarketChart
                    data={chartData}
                    lines={[
                      { key: 'yes', label: yesLabel, color: currentCategory === 'crypto' ? '#facc15' : '#22c55e' },
                      { key: 'no', label: noLabel, color: '#ef4444' },
                    ]}
                    height={isMobile ? 220 : 350}
                    showDates={true}
                  />
                </>
              )}
            </div>

            {/* Order Book */}
            <OrderBook yesPrice={yesPrice} marketId={marketId} volume={volume} />

            {/* Tabs */}
            <Tabs defaultValue="comments">
              <TabsList className="w-full overflow-x-auto flex">
                <TabsTrigger value="comments" className="flex-1 min-w-[80px]">Discussão</TabsTrigger>
                <TabsTrigger value="positions" className="flex-1 min-w-[80px]">Posições</TabsTrigger>
                <TabsTrigger value="activity" className="flex-1 min-w-[80px]">Atividade</TabsTrigger>
                <TabsTrigger value="about" className="flex-1 min-w-[80px]">Regras</TabsTrigger>
              </TabsList>
              <TabsContent value="comments" className="mt-4"><MarketCommentSection marketId={marketId} holderUserIds={holderUserIds} /></TabsContent>
              <TabsContent value="positions" className="mt-4">
                <div className="bg-card border border-border rounded-xl p-5">
                  {myPositions.length === 0 ? (
                    <p className="text-muted-foreground text-center text-sm py-6">Você não possui posições neste mercado.</p>
                  ) : (
                    <div className="space-y-3">
                      {myPositions.map((bet) => {
                        const isYes = bet.position === 'yes';
                        const currentP = isYes ? yesPrice : noPrice;
                        const pnl = (currentP - Number(bet.price_at_bet)) * (Number(bet.amount) / Number(bet.price_at_bet));
                        const roi = ((currentP / Number(bet.price_at_bet)) - 1) * 100;
                        return (
                          <div key={bet.id} className="border border-border rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: isYes ? 'hsl(152, 69%, 45%)' : 'hsl(0, 72%, 55%)' }} />
                                <span className="text-sm font-bold text-foreground">{isYes ? yesLabel : noLabel}</span>
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: pnl >= 0 ? 'hsla(152, 69%, 45%, 0.15)' : 'hsla(0, 72%, 51%, 0.15)', color: pnl >= 0 ? 'hsl(152, 69%, 50%)' : 'hsl(0, 72%, 60%)' }}>
                                {pnl >= 0 ? '+' : ''}{formatBRL(pnl)} ({roi >= 0 ? '+' : ''}{roi.toFixed(1)}%)
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-xs">
                              <div><span className="text-muted-foreground block">Investido</span><span className="font-bold text-foreground">{formatBRL(Number(bet.amount))}</span></div>
                              <div><span className="text-muted-foreground block">Shares</span><span className="font-bold text-foreground">{(Number(bet.amount) / Number(bet.price_at_bet)).toFixed(2)}</span></div>
                              <div><span className="text-muted-foreground block">Preço médio</span><span className="font-bold text-foreground">R${Number(bet.price_at_bet).toFixed(2)}</span></div>
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
                        Este mercado será resolvido como "<strong className="text-foreground">{yesLabel}</strong>" se o evento descrito no título ocorrer até a data de resolução especificada. Caso contrário, será resolvido como "<strong className="text-foreground">{noLabel}</strong>".
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Critérios de Resolução</h4>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>A resolução é baseada em fontes oficiais e verificáveis.</li>
                        <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>O mercado fecha automaticamente na data limite.</li>
                        <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Pagamentos são processados automaticamente após a resolução.</li>
                        {endDate && <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Data limite: <strong className="text-foreground">{new Date(endDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></li>}
                      </ul>
                    </div>
                    <div className="space-y-2.5">
                      <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Como Funciona</h4>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Compre "<strong className="text-foreground">{yesLabel}</strong>" se acredita que o evento vai acontecer.</li>
                        <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Compre "<strong className="text-foreground">{noLabel}</strong>" se acredita que não vai acontecer.</li>
                        <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Se sua previsão estiver correta, você recebe R$1,00 por contrato.</li>
                        <li className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span>Você pode vender sua posição a qualquer momento antes da resolução.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - hidden on mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-4">
            {/* Trade card - Polymarket style */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Buy / Sell tabs */}
              <div className="flex items-center justify-between border-b border-border px-5 pt-4 pb-0">
                <div className="flex gap-4">
                  <button
                    onClick={() => setTradeTab('buy')}
                    className={`pb-3 text-sm font-semibold transition-colors relative ${tradeTab === 'buy' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Comprar
                    {tradeTab === 'buy' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />}
                  </button>
                  <button
                    onClick={() => setTradeTab('sell')}
                    className={`pb-3 text-sm font-semibold transition-colors relative ${tradeTab === 'sell' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    Vender
                    {tradeTab === 'sell' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground rounded-full" />}
                  </button>
                </div>
              </div>

              <div className="p-5">
                {tradeTab === 'buy' ? (
                  <>
                    {/* Yes/No outcome buttons */}
                    <div className="flex gap-2 mb-5">
                      <button
                        onClick={() => setPosition('yes')}
                        className="flex-1 py-3 rounded-lg font-bold text-sm transition-all"
                        style={{
                          backgroundColor: position === 'yes' ? 'hsl(152, 69%, 45%)' : 'hsla(152, 69%, 45%, 0.12)',
                          color: position === 'yes' ? '#fff' : 'hsl(152, 69%, 50%)',
                        }}
                      >
                        {isCrypto ? `PARA CIMA ${yesMultiplier.toFixed(2)}x` : `${yesLabel} R$${yesPrice.toFixed(2)}`}
                      </button>
                      <button
                        onClick={() => setPosition('no')}
                        className="flex-1 py-3 rounded-lg font-bold text-sm transition-all"
                        style={{
                          backgroundColor: position === 'no' ? 'hsl(0, 72%, 55%)' : 'hsla(0, 72%, 51%, 0.12)',
                          color: position === 'no' ? '#fff' : 'hsl(0, 72%, 60%)',
                        }}
                      >
                        {isCrypto ? `PARA BAIXO ${noMultiplier.toFixed(2)}x` : `${noLabel} R$${noPrice.toFixed(2)}`}
                      </button>
                    </div>

                    {/* Amount section */}
                    <div className="mb-4">
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">Quantidade</span>
                        <span className="text-xs text-muted-foreground">Saldo {wallet ? formatBRL(wallet.balance) : 'R$ 0,00'}</span>
                      </div>
                      <div className="relative flex items-center justify-center py-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-muted-foreground text-2xl font-semibold">R$</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={amountStr}
                            onChange={handleAmountChange}
                            onBlur={() => { if (amountStr === '' || amount <= 0) setAmountStr('10'); }}
                            className="bg-transparent text-4xl font-bold text-foreground text-center outline-none w-28 tabular-nums"
                            style={{ caretColor: 'hsl(var(--primary))' }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {[1, 5, 10, 100].map((val) => (
                          <button
                            key={val}
                            onClick={() => setAmountStr(String(amount + val))}
                            className="flex-1 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-muted transition-colors text-foreground"
                          >
                            +R${val}
                          </button>
                        ))}
                        <button
                          onClick={() => wallet && setAmountStr(String(Math.floor(wallet.balance)))}
                          className="flex-1 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-muted transition-colors text-foreground"
                        >
                          Max
                        </button>
                      </div>
                    </div>

                    {/* Order stats */}
                    {amount > 0 && (
                      <div className="rounded-lg p-3 mb-4 space-y-1.5 text-sm border border-border">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Shares a receber</span>
                          <span className="font-semibold text-foreground">{(amount / currentPrice).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Preço médio</span>
                          <span className="font-semibold text-foreground">R${currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Retorno potencial</span>
                          <span className="font-semibold" style={{ color: 'hsl(152, 69%, 50%)' }}>{formatBRL(potentialReturn)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ROI potencial</span>
                          <span className="font-semibold" style={{ color: 'hsl(152, 69%, 50%)' }}>+{((potentialReturn / amount - 1) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full h-12 text-sm font-bold rounded-lg"
                      onClick={handleTrade}
                      disabled={isPlacingBet || walletLoading}
                      style={{
                        backgroundColor: position === 'yes' ? 'hsl(152, 69%, 45%)' : 'hsl(0, 72%, 55%)',
                        color: '#fff',
                      }}
                    >
                      {isPlacingBet ? 'Processando...' : `Palpitar em ${position === 'yes' ? yesLabel : noLabel}`}
                    </Button>
                  </>
                ) : (
                  /* SELL TAB */
                  <>
                    {myPositions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-sm mb-2">Você não possui posições neste mercado.</p>
                        <button
                          onClick={() => setTradeTab('buy')}
                          className="text-primary text-sm font-semibold hover:underline"
                        >
                          Comprar uma posição
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground mb-3">Suas posições abertas neste mercado:</p>
                        {myPositions.map((bet) => {
                          const isYes = bet.position === 'yes';
                          const betAmount = Number(bet.amount);
                          const sellAmt = parseFloat(sellAmountStr) || 0;
                          const estimatedReturn = Math.min(sellAmt, betAmount) * 0.95;
                          return (
                            <div key={bet.id} className="border border-border rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: isYes ? 'hsl(152, 69%, 45%)' : 'hsl(0, 72%, 55%)' }}
                                  />
                                  <span className="text-sm font-bold text-foreground">
                                    {isYes ? yesLabel : noLabel}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  Comprado a R${Number(bet.price_at_bet).toFixed(2)}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                  <span className="text-muted-foreground block">Investido</span>
                                  <span className="font-bold text-foreground">{formatBRL(betAmount)}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground block">Retorno máx.</span>
                                  <span className="font-bold" style={{ color: 'hsl(152, 69%, 50%)' }}>{formatBRL(Number(bet.potential_payout))}</span>
                                </div>
                              </div>

                              {/* Sell amount input */}
                              <div>
                                <div className="flex items-baseline justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">Valor para vender</span>
                                  <button
                                    onClick={() => setSellAmountStr(String(betAmount))}
                                    className="text-[10px] text-primary font-semibold hover:underline"
                                  >
                                    Vender tudo
                                  </button>
                                </div>
                                <div className="relative flex items-center justify-center py-2">
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-muted-foreground text-lg font-semibold">R$</span>
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={sellAmountStr}
                                      onChange={(e) => {
                                        const v = e.target.value;
                                        if (v === '' || /^\d*\.?\d*$/.test(v)) setSellAmountStr(v);
                                      }}
                                      placeholder="0"
                                      className="bg-transparent text-3xl font-bold text-foreground text-center outline-none w-24 tabular-nums placeholder:text-muted-foreground/30"
                                      style={{ caretColor: 'hsl(var(--primary))' }}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Sell estimate */}
                              {sellAmt > 0 && (
                                <div className="rounded-lg p-3 space-y-1 text-xs border border-border">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Você recebe (taxa 5%)</span>
                                    <span className="font-bold" style={{ color: 'hsl(152, 69%, 50%)' }}>{formatBRL(estimatedReturn)}</span>
                                  </div>
                                </div>
                              )}

                              <Button
                                className="w-full h-11 text-sm font-bold rounded-lg"
                                onClick={() => handleSell(bet.id, Math.min(sellAmt || betAmount, betAmount))}
                                disabled={isSelling || walletLoading || sellAmt <= 0}
                                style={{ backgroundColor: 'hsl(0, 72%, 55%)', color: '#fff' }}
                              >
                                {isSelling ? 'Vendendo...' : `Vender ${sellAmt > 0 ? formatBRL(Math.min(sellAmt, betAmount)) : 'posição'}`}
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Você precisa <Link to="/login" className="text-primary hover:underline">entrar</Link> para negociar
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
                  Ao negociar, você concorda com os <Link to="/terms" className="underline hover:text-foreground">Termos de Uso</Link>.
                </p>
              </div>
            </div>

            {/* Related markets */}
            {relatedMarkets.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h4 className="text-sm font-bold text-foreground mb-3">Mercados relacionados</h4>
                <div className="space-y-3">
                  {relatedMarkets.map((m) => {
                    const pct = Math.round(m.yesPrice * 100);
                    return (
                      <Link
                        key={m.id}
                        to={m.isMultiOption && m.options?.length
                          ? `/market-detail?id=${m.id}&title=${encodeURIComponent(m.question)}&image=${encodeURIComponent(m.imageUrl)}&volume=${m.volume}&options=${encodeURIComponent(JSON.stringify(m.options))}${m.endDate ? `&endDate=${m.endDate}` : ''}`
                          : `/market?id=${m.id}&title=${encodeURIComponent(m.question)}&yes=${m.yesPrice}&image=${encodeURIComponent(m.imageUrl)}${m.endDate ? `&endDate=${m.endDate}` : ''}${m.clobTokenIds?.[0] ? `&tokenId=${m.clobTokenIds[0]}` : ''}&volume=${m.volume}`
                        }
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
      </div>

      {/* Mobile trade bar */}
      {/* Mobile fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-card/95 backdrop-blur border-t border-border p-3" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2">
          <button
            onClick={() => { setPosition('yes'); setMobileTradeOpen(true); }}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ backgroundColor: 'hsl(152, 69%, 45%)', color: '#fff' }}
          >
            {isCrypto ? `PARA CIMA ${yesMultiplier.toFixed(2)}x` : `${yesLabel} ${yesPercent}%`}
          </button>
          <button
            onClick={() => { setPosition('no'); setMobileTradeOpen(true); }}
            className="flex-1 py-3 rounded-xl font-bold text-sm"
            style={{ backgroundColor: 'hsl(0, 72%, 55%)', color: '#fff' }}
          >
            {isCrypto ? `PARA BAIXO ${noMultiplier.toFixed(2)}x` : `${noLabel} ${noPercent}%`}
          </button>
        </div>
      </div>

      <MobileTradeBar
        marketId={marketId}
        title={decodeURIComponent(title)}
        imageUrl={imageUrl ? decodeURIComponent(imageUrl) : undefined}
        yesPrice={yesPrice}
        yesLabel={yesLabel}
        noLabel={noLabel}
        isOpen={mobileTradeOpen}
        onOpenChange={setMobileTradeOpen}
        initialPosition={position}
      />
    </div>
  );
}
