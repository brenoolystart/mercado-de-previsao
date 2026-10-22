/**
 * Server-side, read-only proxy for Polymarket's public Gamma API.
 * Used solely to keep the public market catalog available when Supabase
 * Edge Functions are unreachable. No user data or trading actions.
 */
type ApiRequest = { method?: string };
type ApiResponse = {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(value: unknown): void;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const offsets = [0, 100, 200];
  const results = await Promise.allSettled(
    offsets.map(async (offset) => {
      const url = new URL('https://gamma-api.polymarket.com/markets');
      url.searchParams.set('active', 'true');
      url.searchParams.set('closed', 'false');
      url.searchParams.set('limit', '100');
      url.searchParams.set('offset', String(offset));
      url.searchParams.set('order', 'volume24hr');
      url.searchParams.set('ascending', 'false');

      const response = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`Gamma API HTTP ${response.status}`);
      }

      const data: unknown = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid Gamma API response');
      }
      return data;
    }),
  );

  const successfulPages = results
    .filter((result): result is PromiseFulfilledResult<unknown[]> => result.status === 'fulfilled')
    .map((result) => result.value);

  if (successfulPages.length === 0) {
    console.error('All Polymarket Gamma API requests failed', results);
    return res.status(502).json({ error: 'Não foi possível consultar os mercados públicos.' });
  }

  const unique = new Map<string, unknown>();
  for (const page of successfulPages) {
    for (const raw of page) {
      if (raw && typeof raw === 'object' && 'id' in raw) {
        const item = raw as Record<string, unknown>;
        if (item.id != null && item.active !== false && item.closed !== true) {
          unique.set(String(item.id), item);
        }
      }
    }
  }

  return res.status(200).json(Array.from(unique.values()));
}
