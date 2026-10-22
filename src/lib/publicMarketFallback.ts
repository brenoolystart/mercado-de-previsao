import type { PredictionMarket, MarketOption } from '@/hooks/useNews';

const PUBLIC_MARKETS_ENDPOINT = '/api/public-markets';

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function classifyMarket(market: Record<string, any>): string {
  const event = Array.isArray(market.events) ? market.events[0] : null;
  const tags = [...asArray(market.tags), ...asArray(event?.tags)]
    .map((t) => (typeof t === 'string' ? t : (t as Record<string, any> | null)?.label || ''))
    .join(' ');
  const text = `${market.question || ''} ${event?.title || ''} ${market.sportsMarketType || ''} ${tags}`.toLowerCase();

  if (/\\b(nba|nfl|nhl|mlb|ncaa|ufc|mma|fifa|football|soccer|basketball|baseball|tennis|cricket|champions league|premier league|formula 1|f1|sports|esports)\\b/.test(text)) return 'sports';
  if (/\\b(bitcoin|btc|ethereum|eth|solana|crypto|dogecoin|xrp|token|blockchain)\\b/.test(text)) return 'crypto';
  if (/\\b(election|president|trump|senate|congress|parliament|governor|vote|politic|democrat|republican)\\b/.test(text)) return 'politics';
  if (/\\b(interest rate|federal reserve|stock|nasdaq|s&p|treasury|bank|dow jones|forex)\\b/.test(text)) return 'finance';
  if (/\\b(inflation|gdp|unemployment|recession|economy|jobs report)\\b/.test(text)) return 'economy';
  if (/\\b(ai|artificial intelligence|openai|chatgpt|apple|google|tesla|microsoft|technology|tech)\\b/.test(text)) return 'tech';
  if (/\\b(oscar|grammy|movie|film|music|celebrity|entertainment|culture)\\b/.test(text)) return 'culture';
  if (/\\b(health|disease|pandemic|vaccine|medicine)\\b/.test(text)) return 'health';
  return 'world';
}

function normalizeMarket(raw: unknown): PredictionMarket | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Record<string, any>;
  if (m.id == null || typeof m.question !== 'string' || !m.question.trim()) return null;

  const outcomes = asArray(m.outcomes).map(String);
  const prices = asArray(m.outcomePrices).map(Number);
  // Never synthesize probabilities for markets without quoted prices.
  if (prices.length < 2 || !Number.isFinite(prices[0]) || !Number.isFinite(prices[1])) return null;
  const price = Math.max(0, Math.min(1, prices[0]));
  const noPrice = Math.max(0, Math.min(1, prices[1]));
  const volumeRaw = Number(m.volume24hr ?? m.volume ?? 0);
  const volume = Number.isFinite(volumeRaw) ? Math.max(0, volumeRaw) : 0;
  const clobTokenIds = asArray(m.clobTokenIds).map(String);
  const isMultiOption = outcomes.length > 2;
  const options: MarketOption[] | undefined = isMultiOption
    ? outcomes.map((label, index) => ({
        label,
        price: Number.isFinite(prices[index]) ? Math.max(0, Math.min(1, prices[index])) : 0,
        tokenId: clobTokenIds[index],
      }))
    : undefined;

  const event = Array.isArray(m.events) ? m.events[0] : null;
  return {
    id: String(m.id),
    question: m.question,
    originalQuestion: m.question,
    subtitle: `Vol: $${volume >= 1000000 ? (volume / 1000000).toFixed(1) + 'M' : volume >= 1000 ? (volume / 1000).toFixed(0) + 'K' : volume.toFixed(0)}`,
    category: classifyMarket(m),
    imageUrl: m.icon || m.image || event?.icon || event?.image || '',
    yesPrice: price,
    noPrice,
    volume,
    source: 'polymarket',
    isMultiOption,
    options,
    outcomeLabels: outcomes.length ? outcomes : undefined,
    endDate: m.endDate || event?.endDate || null,
    clobTokenIds: clobTokenIds.length ? clobTokenIds : undefined,
  };
}

/**
 * Browsing-only fallback for public market data. No authentication, wagers,
 * payment endpoints or user information are routed through this proxy.
 */
export async function fetchPublicMarketsFallback(): Promise<PredictionMarket[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(PUBLIC_MARKETS_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
      cache: 'no-store',
      credentials: 'omit',
    });
    if (!response.ok) throw new Error(`Polymarket proxy: HTTP ${response.status}`);
    const raw: unknown = await response.json();
    if (!Array.isArray(raw)) throw new Error('Resposta inválida da API pública de mercados.');
    const markets = raw.map(normalizeMarket).filter((market): market is PredictionMarket => market !== null);
    if (markets.length === 0) throw new Error('API pública não retornou mercados com preços válidos.');
    return markets;
  } finally {
    clearTimeout(timer);
  }
}
