import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, RefreshCw, BarChart3, LineChart } from 'lucide-react';
import { PredictionMarketChart, type ChartDataPoint } from '@/components/PredictionMarketChart';

interface PriceHistoryChartProps {
  yesPrice: number;
  marketId: string;
  isCrypto?: boolean;
  cryptoSymbol?: string;
  marketTitle?: string;
}

interface CryptoData {
  currentPrice: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceHistory: { time: number; open: number; high: number; low: number; close: number; volume: number }[];
}

const chartConfig = {
  yes: { label: 'Sim', color: 'hsl(var(--green))' },
  no: { label: 'Não', color: 'hsl(var(--red))' },
  price: { label: 'Preço', color: 'hsl(var(--primary))' },
} satisfies ChartConfig;

const INTERVALS = [
  { label: '5 Min', value: '5m', limit: 60 },
  { label: '15 Min', value: '15m', limit: 60 },
  { label: '1 Hora', value: '1h', limit: 48 },
  { label: '1 Dia', value: '1d', limit: 30 },
];

function generatePriceHistory(currentYesPrice: number, marketId: string) {
  const dataPoints = 30;
  const history = [];
  const seed = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let price = 0.3 + ((seed % 40) / 100);
  for (let i = 0; i < dataPoints; i++) {
    const progress = i / (dataPoints - 1);
    const targetPrice = currentYesPrice;
    const noise = (Math.sin(seed + i * 0.5) * 0.08);
    price = price * (1 - progress * 0.3) + targetPrice * progress * 0.3 + noise;
    price = Math.max(0.05, Math.min(0.95, price));
    const date = new Date();
    date.setDate(date.getDate() - (dataPoints - i));
    history.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      yes: Math.round(price * 100),
      no: Math.round((1 - price) * 100),
    });
  }
  return history;
}

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

function formatPrice(price: number): string {
  return `R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

function formatPriceShort(price: number): string {
  if (price >= 1000) return price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

/* ── Last-results row (Palpitano "Últimos" arrows) ── */
function LastResults({ data }: { data: { open: number; close: number }[] }) {
  const last6 = data.slice(-6);
  if (last6.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span>Últimos</span>
      <div className="flex items-center gap-0.5">
        {last6.map((c, i) => (
          <span
            key={i}
            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
              c.close >= c.open
                ? 'bg-green/20 text-green'
                : 'bg-red/20 text-red'
            }`}
          >
            {c.close >= c.open ? '▲' : '▼'}
          </span>
        ))}
      </div>
    </div>
  );
}

export function PriceHistoryChart({ yesPrice, marketId, isCrypto, cryptoSymbol, marketTitle }: PriceHistoryChartProps) {
  const [cryptoData, setCryptoData] = useState<CryptoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [chartMode, setChartMode] = useState<'area' | 'candlestick'>('area');
  const [startPrice, setStartPrice] = useState<number | null>(null);

  const detectedSymbol = cryptoSymbol || (marketTitle ? detectCryptoSymbol(marketTitle) : null);
  const showCrypto = isCrypto || !!detectedSymbol;

  const fetchCryptoData = useCallback(async () => {
    if (!showCrypto || !detectedSymbol) return;
    setLoading(true);
    try {
      const interval = INTERVALS[selectedInterval];
      const { data, error } = await supabase.functions.invoke('fetch-crypto-price', {
        body: { symbol: detectedSymbol, interval: interval.value, limit: interval.limit },
      });
      if (error) throw error;
      setCryptoData(data);
      // Set start price from first candle of interval
      if (data?.priceHistory?.length > 0) {
        setStartPrice(data.priceHistory[0].open);
      }
    } catch (err) {
      console.error('Error fetching crypto data:', err);
    } finally {
      setLoading(false);
    }
  }, [showCrypto, detectedSymbol, selectedInterval]);

  useEffect(() => {
    fetchCryptoData();
  }, [fetchCryptoData]);

  useEffect(() => {
    if (!autoRefresh || !showCrypto) return;
    const timer = setInterval(fetchCryptoData, 10000);
    return () => clearInterval(timer);
  }, [autoRefresh, showCrypto, fetchCryptoData]);

  const defaultData = useMemo(
    () => generatePriceHistory(yesPrice, marketId),
    [yesPrice, marketId]
  );

  const cryptoChartData = useMemo((): ChartDataPoint[] => {
    if (!cryptoData?.priceHistory) return [];
    return cryptoData.priceHistory.map((p) => ({
      t: Math.floor(p.time / 1000),
      price: p.close,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
      volume: p.volume,
    }));
  }, [cryptoData]);

  const priceDirection = cryptoData ? (cryptoData.currentPrice >= (startPrice || cryptoData.currentPrice) ? 'up' : 'down') : null;
  const priceDiff = cryptoData && startPrice ? cryptoData.currentPrice - startPrice : 0;
  const lineColor = priceDirection === 'up' ? '#22c55e' : '#ef4444';

  const chartData = useMemo(() => defaultData.map((d, i) => ({
    t: i, date: d.date, yes: d.yes, no: d.no,
  })), [defaultData]);

  if (showCrypto && detectedSymbol) {
    return (
      <div className="w-full">
        {/* ── Palpitano-style header ── */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green animate-pulse" />
              <span className="text-[11px] font-bold text-green uppercase tracking-wide">AO VIVO</span>
            </div>
            <LastResults data={cryptoData?.priceHistory || []} />
          </div>
          <div className="flex items-center gap-2">
            {/* Interval selector */}
            {INTERVALS.map((interval, idx) => (
              <button
                key={interval.value}
                onClick={() => setSelectedInterval(idx)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors ${
                  selectedInterval === idx
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                {interval.label}
              </button>
            ))}
            {/* Chart type toggle */}
            <div className="flex items-center gap-0.5 bg-secondary/60 rounded-lg p-0.5 ml-1">
              <button
                onClick={() => setChartMode('area')}
                className={`p-1.5 rounded-md transition-colors ${
                  chartMode === 'area' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <LineChart className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setChartMode('candlestick')}
                className={`p-1.5 rounded-md transition-colors ${
                  chartMode === 'candlestick' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── PREÇO INICIAL / PREÇO ATUAL row ── */}
        {cryptoData && (
          <div className="flex items-center justify-between mb-3 px-1">
            <div>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Preço Inicial</div>
              <div className="text-sm font-bold text-foreground">{formatPrice(startPrice || cryptoData.priceHistory?.[0]?.open || 0)}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                priceDiff >= 0 ? 'bg-green/15 text-green' : 'bg-red/15 text-red'
              }`}>
                {priceDiff >= 0 ? '▲' : '▼'} R$ {Math.abs(priceDiff).toFixed(0)}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Preço Atual</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Preço Atual</div>
              <div className={`text-sm font-bold ${priceDiff >= 0 ? 'text-green' : 'text-red'}`}>
                {formatPrice(cryptoData.currentPrice)}
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        <PredictionMarketChart
          data={cryptoChartData}
          lines={[{ key: 'price', label: detectedSymbol?.replace('USDT', '') || 'Price', color: lineColor }]}
          height={300}
          domain={['auto', 'auto']}
          yFormatter={(v) => `R$ ${formatPriceShort(v)}`}
          chartType={chartMode}
          showDates
          startPrice={startPrice || undefined}
        />

        {/* Stats row */}
        {cryptoData && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-muted-foreground">Máx 24h</div>
              <div className="text-xs font-semibold text-foreground">R$ {formatPriceShort(cryptoData.high24h)}</div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-muted-foreground">Mín 24h</div>
              <div className="text-xs font-semibold text-foreground">R$ {formatPriceShort(cryptoData.low24h)}</div>
            </div>
            <div className="bg-secondary/50 rounded-xl p-2.5 text-center">
              <div className="text-[10px] text-muted-foreground">Vol 24h</div>
              <div className="text-xs font-semibold text-foreground">{formatVolume(cryptoData.volume24h)}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="font-bold text-foreground mb-4">Histórico de Preços</h3>
      <div className="h-[200px] md:h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 40, left: 0, bottom: 20 }}>
            <defs>
              <linearGradient id="gradientYes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--green))" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(var(--green))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradientNo" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--red))" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(var(--red))" stopOpacity={0} />
              </linearGradient>
            </defs>
            {[0, 25, 50, 75, 100].map(v => (
              <ReferenceLine key={v} y={v} stroke="hsl(var(--border))" strokeDasharray="3 3" strokeWidth={1} />
            ))}
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} dy={8} />
            <YAxis orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={35} ticks={[0, 25, 50, 75, 100]} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <span className="font-medium">{name === 'yes' ? 'Sim' : 'Não'}: {value}%</span>
                  )}
                />
              }
            />
            <Area type="monotone" dataKey="yes" stroke="hsl(38, 92%, 50%)" strokeWidth={2} fill="url(#gradientYes)" dot={false} />
            <Area type="monotone" dataKey="no" stroke="hsl(217, 91%, 60%)" strokeWidth={2} fill="url(#gradientNo)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
