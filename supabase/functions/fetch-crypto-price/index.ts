import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Binance kline intervals mapped from our UI intervals
const INTERVAL_MAP: Record<string, { klineInterval: string; limit: number }> = {
  "5m": { klineInterval: "1m", limit: 60 },      // 1-min candles, last 60 = 1h of data
  "15m": { klineInterval: "5m", limit: 60 },     // 5-min candles, last 60 = 5h
  "1h": { klineInterval: "15m", limit: 96 },     // 15-min candles, last 96 = 24h
  "1d": { klineInterval: "1h", limit: 120 },     // 1h candles, last 120 = 5 days
};

const VALID_SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "DOGEUSDT", "XRPUSDT", "ADAUSDT"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol = "BTCUSDT", interval = "5m" } = await req.json().catch(() => ({}));

    if (!VALID_SYMBOLS.includes(symbol)) {
      return new Response(
        JSON.stringify({ error: `Unsupported symbol: ${symbol}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const params = INTERVAL_MAP[interval] || INTERVAL_MAP["5m"];

    // Try multiple Binance endpoints (some geo-restrict)
    const binanceEndpoints = [
      'https://data-api.binance.vision',
      'https://api.binance.com',
      'https://api1.binance.com',
      'https://api3.binance.com',
    ];

    let klinesRes: Response | null = null;
    let tickerRes: Response | null = null;

    for (const base of binanceEndpoints) {
      try {
        const [kr, tr] = await Promise.all([
          fetch(`${base}/api/v3/klines?symbol=${symbol}&interval=${params.klineInterval}&limit=${params.limit}`),
          fetch(`${base}/api/v3/ticker/24hr?symbol=${symbol}`),
        ]);
        if (kr.ok && tr.ok) {
          klinesRes = kr;
          tickerRes = tr;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!klinesRes || !tickerRes) {
      throw new Error('All Binance endpoints failed — possibly geo-restricted');
    }

    const [klines, ticker] = await Promise.all([klinesRes.json(), tickerRes.json()]);

    // Binance kline format: [openTime, open, high, low, close, volume, closeTime, ...]
    const priceHistory = klines.map((k: any[]) => ({
      time: k[0],           // openTime ms
      open: parseFloat(k[1]),
      high: parseFloat(k[2]),
      low: parseFloat(k[3]),
      close: parseFloat(k[4]),
      volume: parseFloat(k[5]),
    }));

    const currentPrice = parseFloat(ticker.lastPrice);
    const priceChange24h = parseFloat(ticker.priceChangePercent);
    const high24h = parseFloat(ticker.highPrice);
    const low24h = parseFloat(ticker.lowPrice);
    const volume24h = parseFloat(ticker.quoteVolume); // in USDT

    return new Response(
      JSON.stringify({
        symbol,
        currentPrice,
        priceChange24h,
        high24h,
        low24h,
        volume24h,
        priceHistory,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching crypto price:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
