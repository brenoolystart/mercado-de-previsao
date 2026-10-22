import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fetchPublicMarketsFallback } from '@/lib/publicMarketFallback';

export interface MarketOption {
  label: string;
  price: number;
  color?: string;
  icon?: string;
  image?: string;
  tokenId?: string;
}

export interface SpreadEntry {
  team: string;
  line: number;
  price: number;
}

export interface TotalEntry {
  type: 'over' | 'under';
  line: number;
  price: number;
}

export interface ScoreEntry {
  team: string;
  score: number;
  period?: string;
}

export interface PredictionMarket {
  id: string;
  question: string;
  originalQuestion?: string;
  subtitle: string;
  category: string;
  imageUrl: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  source?: string;
  isMultiOption?: boolean;
  options?: MarketOption[];
  outcomeLabels?: string[];
  endDate?: string | null;
  clobTokenIds?: string[];
  sportKey?: string;
  sportLabel?: string;
  sportImage?: string;
  seriesTitle?: string;
  spreadData?: SpreadEntry[];
  totalData?: TotalEntry[];
  liveScores?: ScoreEntry[];
  isLive?: boolean;
}

export interface TrendingTopic {
  id: string;
  label: string;
}

const UPDATE_INTERVAL = 60000;
const CACHE_KEY = 'polymarket_cache_v9';
const CACHE_DURATION = 300000; // 5 minutes - serve cached real data instantly on reload

interface CacheData {
  timestamp: number;
  markets: Record<string, PredictionMarket[]>;
  allMarkets: PredictionMarket[];
  trendingTopics: TrendingTopic[];
}

const categories = ['politics', 'tech', 'sports', 'finance', 'crypto', 'world', 'culture', 'economy', 'health'];

function getCache(): CacheData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const data: CacheData = JSON.parse(cached);
    const now = Date.now();

    if (now - data.timestamp < CACHE_DURATION) {
      return data;
    }

    return null;
  } catch {
    return null;
  }
}

function setCache(markets: Record<string, PredictionMarket[]>, allMarkets: PredictionMarket[], trendingTopics: TrendingTopic[]) {
  try {
    const data: CacheData = {
      timestamp: Date.now(),
      markets,
      allMarkets,
      trendingTopics,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to cache data:', e);
  }
}

function getDefaultTopics(): TrendingTopic[] {
  return [
    { id: 'trump', label: 'Trump' },
    { id: 'bitcoin', label: 'Bitcoin' },
    { id: 'inteligência artificial', label: 'Inteligência Artificial' },
    { id: 'eleições', label: 'Eleições' },
    { id: 'irã', label: 'Irã' },
    { id: 'nba', label: 'NBA' },
    { id: 'ethereum', label: 'Ethereum' },
    { id: 'musk', label: 'Musk' },
    { id: 'fed', label: 'Fed' },
    { id: 'copa', label: 'Copa' },
  ];
}

// Auto-extract trending topics from actual market data
function extractTopicsFromMarkets(markets: PredictionMarket[]): TrendingTopic[] {
  // Known entities/topics to detect in market questions (label → search terms)
  const KNOWN_TOPICS: { id: string; label: string; terms: string[] }[] = [
    { id: 'trump', label: 'Trump', terms: ['trump'] },
    { id: 'bitcoin', label: 'Bitcoin', terms: ['bitcoin', 'btc'] },
    { id: 'ethereum', label: 'Ethereum', terms: ['ethereum', 'eth'] },
    { id: 'solana', label: 'Solana', terms: ['solana', 'sol'] },
    { id: 'xrp', label: 'XRP', terms: ['xrp', 'ripple'] },
    { id: 'dogecoin', label: 'Dogecoin', terms: ['doge', 'dogecoin'] },
    { id: 'eleições', label: 'Eleições', terms: ['election', 'eleição', 'eleicao', 'presidential', 'nominee', 'primary', 'primaries'] },
    { id: 'irã', label: 'Irã', terms: ['iran', 'iranian', 'tehran'] },
    { id: 'israel', label: 'Israel', terms: ['israel', 'israeli', 'gaza', 'hamas'] },
    { id: 'china', label: 'China', terms: ['china', 'chinese', 'beijing', 'xi jinping'] },
    { id: 'ucrânia', label: 'Ucrânia', terms: ['ukraine', 'ukrainian', 'zelensky', 'kyiv'] },
    { id: 'rússia', label: 'Rússia', terms: ['russia', 'russian', 'putin', 'moscow'] },
    { id: 'cuba', label: 'Cuba', terms: ['cuba', 'cuban', 'havana'] },
    { id: 'nba', label: 'NBA', terms: ['nba'] },
    { id: 'nfl', label: 'NFL', terms: ['nfl', 'super bowl'] },
    { id: 'nhl', label: 'NHL', terms: ['nhl', 'stanley cup'] },
    { id: 'mlb', label: 'MLB', terms: ['mlb', 'world series'] },
    { id: 'ncaa', label: 'NCAA', terms: ['ncaa', 'march madness', 'ncaab'] },
    { id: 'ucl', label: 'Champions League', terms: ['ucl', 'champions league', 'uefa'] },
    { id: 'f1', label: 'Fórmula 1', terms: ['formula 1', 'f1', 'grand prix'] },
    { id: 'ufc', label: 'UFC', terms: ['ufc', 'mma'] },
    { id: 'fed', label: 'Fed', terms: ['federal reserve', 'fed ', 'fomc', 'interest rate', 'rate cut'] },
    { id: 'petróleo', label: 'Petróleo', terms: ['oil', 'petroleum', 'crude', 'opec'] },
    { id: 'openai', label: 'OpenAI', terms: ['openai', 'chatgpt', 'gpt'] },
    { id: 'inteligência artificial', label: 'IA', terms: ['artificial intelligence', ' ai ', 'ai-', 'machine learning', 'llm'] },
    { id: 'musk', label: 'Musk', terms: ['musk', 'elon'] },
    { id: 'tesla', label: 'Tesla', terms: ['tesla', 'tsla'] },
    { id: 'apple', label: 'Apple', terms: ['apple', 'iphone'] },
    { id: 'google', label: 'Google', terms: ['google', 'alphabet', 'gemini'] },
    { id: 'senate', label: 'Senado', terms: ['senate', 'senator'] },
    { id: 'congress', label: 'Congresso', terms: ['congress', 'congressional', 'house of rep'] },
    { id: 'dólar', label: 'Dólar', terms: ['dollar', 'usd', 'dólar'] },
    { id: 'ouro', label: 'Ouro', terms: ['gold', 'ouro'] },
    { id: 'clima', label: 'Clima', terms: ['weather', 'temperature', 'hurricane', 'storm', 'snow'] },
    { id: 'copa', label: 'Copa', terms: ['world cup', 'copa do mundo', 'fifa'] },
    { id: 'twitter', label: 'Twitter/X', terms: ['tweet', 'twitter', ' x post', 'x.com'] },
    { id: 'tiktok', label: 'TikTok', terms: ['tiktok', 'tik tok'] },
    { id: 'covid', label: 'COVID', terms: ['covid', 'pandemic', 'coronavirus'] },
    { id: 'oscars', label: 'Oscar', terms: ['oscar', 'academy award'] },
    { id: 'midterms', label: 'Midterms', terms: ['midterm'] },
    { id: 'tariffs', label: 'Tarifas', terms: ['tariff', 'tarifa', 'trade war'] },
  ];

  // Count matches per topic weighted by market volume
  const topicScores: Record<string, number> = {};

  for (const market of markets) {
    const text = `${market.question} ${market.originalQuestion || ''} ${market.subtitle || ''}`.toLowerCase();

    for (const topic of KNOWN_TOPICS) {
      if (topic.terms.some(term => text.includes(term))) {
        topicScores[topic.id] = (topicScores[topic.id] || 0) + market.volume;
      }
    }
  }

  // Sort by total volume and return as topics
  const sorted = Object.entries(topicScores)
    .sort(([, a], [, b]) => b - a);

  const topicMap = new Map(KNOWN_TOPICS.map(t => [t.id, t.label]));

  return sorted.map(([id]) => ({
    id,
    label: topicMap.get(id) || id,
  }));
}

// Generate demo markets for when edge function is not available
function generateDemoMarkets(): PredictionMarket[] {
  const demoMarkets: PredictionMarket[] = [
    { id: '1', question: 'Bitcoin vai ultrapassar $100k em 2025?', subtitle: 'Criptomoedas', category: 'crypto', imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=400&fit=crop', yesPrice: 0.65, noPrice: 0.35, volume: 2500000 },
    { id: '2', question: 'Trump vai ganhar as eleições de 2028?', subtitle: 'Política', category: 'politics', imageUrl: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=400&h=400&fit=crop', yesPrice: 0.42, noPrice: 0.58, volume: 5000000 },
    { id: '3', question: 'A Apple vai lançar um novo produto de AI?', subtitle: 'Tecnologia', category: 'tech', imageUrl: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=400&fit=crop', yesPrice: 0.78, noPrice: 0.22, volume: 1200000 },
    { id: '4', question: 'O Brasil vai ganhar a Copa do Mundo?', subtitle: 'Esportes', category: 'sports', imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=400&fit=crop', yesPrice: 0.25, noPrice: 0.75, volume: 800000 },
    { id: '5', question: 'Ethereum vai superar $5000?', subtitle: 'Criptomoedas', category: 'crypto', imageUrl: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=400&h=400&fit=crop', yesPrice: 0.55, noPrice: 0.45, volume: 3200000 },
    { id: '6', question: 'O Fed vai cortar juros novamente?', subtitle: 'Finanças', category: 'finance', imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=400&fit=crop', yesPrice: 0.72, noPrice: 0.28, volume: 4100000 },
    { id: '7', question: 'Guerra na Ucrânia vai acabar em 2025?', subtitle: 'Geopolítica', category: 'world', imageUrl: 'https://images.unsplash.com/photo-1569025690938-a00729c9e1f9?w=400&h=400&fit=crop', yesPrice: 0.18, noPrice: 0.82, volume: 6000000 },
    { id: '8', question: 'Oscar de Melhor Filme vai para um filme de AI?', subtitle: 'Cultura', category: 'culture', imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=400&fit=crop', yesPrice: 0.12, noPrice: 0.88, volume: 500000 },
    { id: '9', question: 'PIB do Brasil vai crescer mais de 3%?', subtitle: 'Economia', category: 'economy', imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&h=400&fit=crop', yesPrice: 0.38, noPrice: 0.62, volume: 900000 },
    { id: '10', question: 'Nova pandemia em 2025?', subtitle: 'Saúde', category: 'health', imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=400&fit=crop', yesPrice: 0.05, noPrice: 0.95, volume: 1500000 },
    { id: '11', question: 'Quem será o próximo CEO da OpenAI?', subtitle: 'Tecnologia', category: 'tech', imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop', yesPrice: 0.5, noPrice: 0.5, volume: 2000000, isMultiOption: true, options: [
      { label: 'Sam Altman continua', price: 0.75, color: 'hsl(142, 76%, 36%)' },
      { label: 'Mira Murati', price: 0.10, color: 'hsl(217, 91%, 60%)' },
      { label: 'Outro executivo', price: 0.15, color: 'hsl(45, 93%, 47%)' },
    ]},
    { id: '12', question: 'Dólar vai chegar a R$6,50?', subtitle: 'Finanças', category: 'finance', imageUrl: 'https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=400&h=400&fit=crop', yesPrice: 0.45, noPrice: 0.55, volume: 3500000 },
  ];
  return demoMarkets;
}

export function useNews() {
  // Try to load from cache first for instant real data on reload
  const cached = getCache();
  const hasCache = cached && cached.allMarkets.length > 0;

  const [marketsByCategory, setMarketsByCategory] = useState<Record<string, PredictionMarket[]>>(
    hasCache ? cached.markets : {}
  );
  const [allMarkets, setAllMarkets] = useState<PredictionMarket[]>(
    hasCache ? cached.allMarkets : []
  );
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>(
    hasCache ? cached.trendingTopics : getDefaultTopics()
  );
  const [loading, setLoading] = useState(!hasCache);
  const [error, setError] = useState<string | null>(null);

  const isInitialLoad = useRef(true);

  const fetchPolymarketData = useCallback(async () => {
    try {
      // Never show loading skeleton if we already have data
      if (allMarkets.length === 0) {
        setLoading(true);
      }
      setError(null);

      // If cache is still valid and we already loaded it in state, just fetch fresh in background
      const freshCache = getCache();
      if (freshCache && freshCache.allMarkets.length > 0 && !isInitialLoad.current) {
        setMarketsByCategory(freshCache.markets);
        setAllMarkets(freshCache.allMarkets);
        setTrendingTopics(freshCache.trendingTopics);
        setLoading(false);
        return;
      }
      // On initial load with cache already in state, skip cache check
      if (hasCache && isInitialLoad.current) {
        isInitialLoad.current = false;
        // Still fetch fresh data in background but don't block
      }

      // Prefer the existing Supabase feed, then the read-only public Polymarket proxy.
      let polymarkets: PredictionMarket[] = [];
      let topics: TrendingTopic[] = getDefaultTopics();

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 9000);
        let data: any;
        let fetchError: any;
        try {
          const result = await supabase.functions.invoke('fetch-polymarket', {
            body: null,
            signal: controller.signal,
          });
          data = result.data;
          fetchError = result.error;
        } finally {
          clearTimeout(timer);
        }

        if (!fetchError && Array.isArray(data?.markets) && data.markets.length > 0) {
          polymarkets = data.markets.map((m: any) => ({
            id: m.id,
            question: m.question,
            originalQuestion: m.originalQuestion,
            subtitle: m.subtitle || `Volume: $${((m.volume || 0) / 1000000).toFixed(1)}M`,
            category: m.category || 'world',
            imageUrl: m.image || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=400&fit=crop`,
            yesPrice: m.yesPercent != null ? m.yesPercent / 100 : 0.5,
            noPrice: m.noPercent != null ? m.noPercent / 100 : 0.5,
            volume: m.volume || 0,
            source: 'polymarket',
            isMultiOption: m.isMultiOption || false,
            options: m.options || undefined,
            outcomeLabels: m.outcomeLabels || undefined,
            endDate: m.endDate || null,
            clobTokenIds: m.clobTokenIds || undefined,
            sportKey: m.sportKey || undefined,
            sportLabel: m.sportLabel || undefined,
            sportImage: m.sportImage || undefined,
            seriesTitle: m.seriesTitle || undefined,
            spreadData: m.spreadData || undefined,
            totalData: m.totalData || undefined,
            liveScores: m.liveScores || undefined,
            isLive: m.isLive || false,
          }));

          // Auto-extract topics from market data, enriched with API topics
          const autoTopics = extractTopicsFromMarkets(polymarkets);
          const apiTopics = data.trendingTopics?.length > 0
            ? data.trendingTopics.map((topic: string) => ({
                id: topic.toLowerCase(),
                label: topic,
              }))
            : [];
          
          // Merge: auto-extracted first (sorted by volume), then API topics not already included
          const seenIds = new Set(autoTopics.map(t => t.id));
          const merged = [...autoTopics];
          for (const t of apiTopics) {
            if (!seenIds.has(t.id)) {
              merged.push(t);
              seenIds.add(t.id);
            }
          }
          topics = merged.length > 0 ? merged : getDefaultTopics();
        }
      } catch (err) {
        console.warn('Supabase market feed unavailable:', err);
      }

      // If Supabase is offline or returns no markets, fetch real public prices
      // through a read-only endpoint on the same Vercel deployment.
      if (polymarkets.length === 0) {
        try {
          polymarkets = await fetchPublicMarketsFallback();
          topics = extractTopicsFromMarkets(polymarkets);
        } catch (err) {
          console.error('Public Polymarket fallback unavailable:', err);
        }
      }

      // No simulated markets: show a clear error if both live feeds fail.
      if (polymarkets.length === 0) {
        // Only show error if we have no existing data
        if (allMarkets.length === 0) {
          setError('Nenhum mercado disponível no momento. Tente novamente.');
        }
        setLoading(false);
        isInitialLoad.current = false;
        return;
      }

      const byCategory: Record<string, PredictionMarket[]> = {};
      categories.forEach((cat) => {
        byCategory[cat] = [];
      });

      polymarkets.forEach((market) => {
        const cat = market.category || 'world';
        if (!byCategory[cat]) {
          byCategory[cat] = [];
        }
        byCategory[cat].push(market);
      });

      setMarketsByCategory(byCategory);
      setAllMarkets(polymarkets);
      setTrendingTopics(topics);
      setCache(byCategory, polymarkets, topics);
    } catch (err) {
      console.error('Error fetching markets:', err);
      // Only set error if no existing data
      if (allMarkets.length === 0) {
        setError('Erro ao carregar enquetes');
      }
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
    }
  }, []);

  useEffect(() => {
    fetchPolymarketData();

    const interval = setInterval(fetchPolymarketData, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPolymarketData]);

  // ── Live score polling every 30s ──
  const SCORE_POLL_INTERVAL = 30000;

  const hasMarkets = allMarkets.length > 0;

  useEffect(() => {
    // Only poll if we have sports markets
    if (!hasMarkets) return;

    const pollScores = async () => {
      try {
        const sportsMarkets = allMarkets.filter(m => m.category === 'sports');
        if (sportsMarkets.length === 0) return;

        const marketMeta = sportsMarkets.map(m => ({
          id: m.id,
          question: m.originalQuestion || m.question,
          optionLabels: m.options?.map(o => o.label) || [],
        }));

        const { data, error: fetchErr } = await supabase.functions.invoke('fetch-live-scores', {
          body: { markets: marketMeta },
        });

        if (fetchErr || !data?.matchedScores) return;

        const matched: Record<string, { scores: ScoreEntry[]; isLive: boolean }> = data.matchedScores;
        if (Object.keys(matched).length === 0) return;

        setAllMarkets(prev => {
          let changed = false;
          const updated = prev.map(market => {
            const scoreData = matched[market.id];
            if (!scoreData) return market;
            const prevScores = JSON.stringify(market.liveScores || []);
            const newScores = JSON.stringify(scoreData.scores || []);
            if (prevScores === newScores && market.isLive === scoreData.isLive) return market;
            changed = true;
            return { ...market, liveScores: scoreData.scores, isLive: scoreData.isLive };
          });
          return changed ? updated : prev;
        });

        setMarketsByCategory(prev => {
          const updated = { ...prev };
          let changed = false;
          for (const cat of Object.keys(updated)) {
            const updatedCat = updated[cat].map(market => {
              const scoreData = matched[market.id];
              if (!scoreData) return market;
              const prevScores = JSON.stringify(market.liveScores || []);
              const newScores = JSON.stringify(scoreData.scores || []);
              if (prevScores === newScores && market.isLive === scoreData.isLive) return market;
              changed = true;
              return { ...market, liveScores: scoreData.scores, isLive: scoreData.isLive };
            });
            updated[cat] = updatedCat;
          }
          return changed ? updated : prev;
        });
      } catch (err) {
        console.warn('Live score poll error:', err);
      }
    };

    const initialTimer = setTimeout(pollScores, 3000);
    const interval = setInterval(pollScores, SCORE_POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [hasMarkets]); // Re-setup when markets first load

  const getMarketsByCategory = useCallback((category: string): PredictionMarket[] => {
    if (category === 'trending' || category === 'all') {
      return allMarkets;
    }
    return marketsByCategory[category] || [];
  }, [allMarkets, marketsByCategory]);

  return {
    markets: allMarkets,
    marketsByCategory,
    getMarketsByCategory,
    trendingTopics,
    loading,
    error,
    refetch: fetchPolymarketData
  };
}
