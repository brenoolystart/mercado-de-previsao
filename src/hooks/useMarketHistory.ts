import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PricePoint {
  t: number; // timestamp (seconds)
  p: number; // price (0-1)
}

const INTERVAL_MAP: Record<string, { interval: string; fidelity: number }> = {
  '1H': { interval: '1h', fidelity: 1 },
  '6H': { interval: '6h', fidelity: 5 },
  '1D': { interval: '1d', fidelity: 15 },
  '1W': { interval: '1w', fidelity: 60 },
  '1M': { interval: '1m', fidelity: 120 },
  'ALL': { interval: 'all', fidelity: 360 },
};

// Cache real history data to avoid repeated calls
const historyCache = new Map<string, { data: PricePoint[]; timestamp: number }>();
const CACHE_TTL = 120000; // 2 minutes

async function fetchTokenHistory(tokenId: string, range: string): Promise<PricePoint[]> {
  const cacheKey = `${tokenId}-${range}`;
  const cached = historyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const params = INTERVAL_MAP[range] || INTERVAL_MAP['ALL'];
  const { data, error } = await supabase.functions.invoke('fetch-market-history', {
    body: { tokenId, interval: params.interval, fidelity: params.fidelity },
  });

  if (error) throw error;

  const points: PricePoint[] = (data?.history || []).map((h: any) => ({
    t: h.t,
    p: h.p,
  }));

  historyCache.set(cacheKey, { data: points, timestamp: Date.now() });
  return points;
}

export function useMarketHistory(tokenId: string | undefined, range: string = 'ALL') {
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!tokenId) return;
    setLoading(true);
    try {
      const points = await fetchTokenHistory(tokenId, range);
      setHistory(points);
    } catch (err) {
      console.error('Error fetching market history:', err);
    } finally {
      setLoading(false);
    }
  }, [tokenId, range]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return { history, loading, refetch: fetchHistory };
}

/**
 * Fetch history for multiple tokens in parallel.
 * Returns a map of key -> PricePoint[]
 */
export function useMultiMarketHistory(
  tokens: { key: string; tokenId: string | undefined }[],
  range: string = 'ALL'
) {
  const tokenKey = useMemo(() => tokens.map(t => `${t.key}:${t.tokenId || ''}`).join('|'), [tokens]);
  const [histories, setHistories] = useState<Record<string, PricePoint[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validTokens = tokens.filter(t => t.tokenId);
    if (validTokens.length === 0) {
      setHistories({});
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all(
      validTokens.map(async (t) => {
        try {
          const points = await fetchTokenHistory(t.tokenId!, range);
          return { key: t.key, points };
        } catch {
          return { key: t.key, points: [] as PricePoint[] };
        }
      })
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, PricePoint[]> = {};
      results.forEach(r => { map[r.key] = r.points; });
      setHistories(map);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [tokenKey, range]);

  return { histories, loading };
}
