import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BitcoinPriceData {
  currentPrice: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  priceHistory: { time: number; open: number; high: number; low: number; close: number }[];
}

// Interval durations in ms
const INTERVAL_MS: Record<string, number> = {
  '5m': 5 * 60_000,
  '15m': 15 * 60_000,
  '1h': 60 * 60_000,
  '1d': 24 * 60 * 60_000,
};

const POLL_MS = 8_000; // poll every 8s for live feel

export function useBitcoinPrice(interval: string = '5m') {
  const [data, setData] = useState<BitcoinPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0); // seconds left in current interval
  const [startPrice, setStartPrice] = useState<number | null>(null); // price at interval start
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const livePointsRef = useRef<{ time: number; open: number; high: number; low: number; close: number }[]>([]);

  // Calculate time remaining in current interval window
  const calcCountdown = useCallback(() => {
    const dur = INTERVAL_MS[interval] || INTERVAL_MS['5m'];
    const now = Date.now();
    const elapsed = now % dur;
    return Math.ceil((dur - elapsed) / 1000);
  }, [interval]);

  const fetchPrice = useCallback(async (isInitial = false) => {
    try {
      const { data: res, error } = await supabase.functions.invoke('fetch-crypto-price', {
        body: { symbol: 'BTCUSDT', interval },
      });
      if (error) throw error;

      const history = res.priceHistory || [];
      const price = res.currentPrice;

      if (isInitial) {
        // Reset live points on initial fetch
        livePointsRef.current = [];
        setStartPrice(price);
      }

      // Append a live tick
      livePointsRef.current.push({ time: Date.now(), open: price, high: price, low: price, close: price });
      // Keep only last 200 live ticks to avoid memory bloat
      if (livePointsRef.current.length > 200) {
        livePointsRef.current = livePointsRef.current.slice(-200);
      }

      // Merge: historical points + live ticks
      const lastHistTime = history.length > 0 ? history[history.length - 1].time : 0;
      const newLivePoints = livePointsRef.current.filter((p) => p.time > lastHistTime);
      const merged = [...history, ...newLivePoints];

      setData({
        currentPrice: price,
        priceChange24h: res.priceChange24h,
        high24h: res.high24h,
        low24h: res.low24h,
        volume24h: res.volume24h,
        priceHistory: merged,
      });
    } catch (err) {
      console.error('Bitcoin price fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [interval]);

  // Reset on interval change
  useEffect(() => {
    livePointsRef.current = [];
    setStartPrice(null);
    setLoading(true);
    fetchPrice(true);

    timerRef.current = setInterval(() => fetchPrice(false), POLL_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchPrice]);

  // Countdown timer ticking every second
  useEffect(() => {
    setCountdown(calcCountdown());
    countdownRef.current = setInterval(() => {
      const secs = calcCountdown();
      setCountdown(secs);

      // When interval resets (countdown hits 0), mark new start price
      if (secs <= 1) {
        // Will be picked up on next poll
        livePointsRef.current = [];
        setStartPrice(null);
      }
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [calcCountdown]);

  return { data, loading, countdown, startPrice };
}
