import { useState, useEffect, useRef, useCallback } from 'react';

export interface WSPriceUpdate {
  assetId: string;
  price: number;
  timestamp: number;
}

interface WSMessage {
  event_type?: string;
  asset_id?: string;
  price?: string | number;
  timestamp?: number;
  market?: string;
  // CLOB book updates
  bids?: { price: string; size: string }[];
  asks?: { price: string; size: string }[];
}

const WS_URL = 'wss://ws-subscriptions-clob.polymarket.com/ws/market';
const PING_INTERVAL = 50_000; // 50 seconds
const RECONNECT_DELAY = 3_000;
const MAX_RECONNECT_DELAY = 30_000;

/**
 * Real-time WebSocket connection to Polymarket CLOB.
 * Subscribes to specified asset (token) IDs and emits price updates.
 */
export function usePolymarketWebSocket(assetIds: string[]) {
  const [prices, setPrices] = useState<Map<string, number>>(new Map());
  const [connected, setConnected] = useState(false);
  const [priceHistory, setPriceHistory] = useState<Map<string, { time: number; price: number }[]>>(new Map());
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectDelayRef = useRef(RECONNECT_DELAY);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const processMessage = useCallback((data: WSMessage) => {
    // Handle book/price update messages
    const assetId = data.asset_id || data.market;
    if (!assetId) return;

    let price: number | null = null;

    // Direct price field
    if (data.price != null) {
      price = typeof data.price === 'string' ? parseFloat(data.price) : data.price;
    }
    // Best bid from order book
    else if (data.bids && data.bids.length > 0) {
      price = parseFloat(data.bids[0].price);
    }

    if (price == null || isNaN(price)) return;

    const now = Date.now();

    setPrices(prev => {
      const next = new Map(prev);
      next.set(assetId, price!);
      return next;
    });

    setPriceHistory(prev => {
      const next = new Map(prev);
      const history = next.get(assetId) || [];
      // Keep last 500 ticks
      const updated = [...history, { time: now, price: price! }].slice(-500);
      next.set(assetId, updated);
      return next;
    });
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || assetIds.length === 0) return;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        setConnected(true);
        reconnectDelayRef.current = RECONNECT_DELAY;

        // Subscribe to each asset
        for (const assetId of assetIds) {
          ws.send(JSON.stringify({
            type: 'market',
            assets_ids: [assetId],
          }));
        }

        // Keepalive ping
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('PING');
          }
        }, PING_INTERVAL);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        const raw = event.data;
        if (raw === 'PONG') return;

        try {
          const parsed: WSMessage | WSMessage[] = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach(processMessage);
          } else {
            processMessage(parsed);
          }
        } catch {
          // Non-JSON message, ignore
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }

        // Exponential backoff reconnect
        reconnectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) connect();
        }, reconnectDelayRef.current);

        reconnectDelayRef.current = Math.min(
          reconnectDelayRef.current * 1.5,
          MAX_RECONNECT_DELAY
        );
      };
    } catch {
      // WebSocket constructor can throw in restrictive environments
      setConnected(false);
    }
  }, [assetIds.join(','), processMessage]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      if (pingRef.current) { clearInterval(pingRef.current); pingRef.current = null; }
      if (reconnectTimerRef.current) { clearTimeout(reconnectTimerRef.current); reconnectTimerRef.current = null; }
    };
  }, [connect]);

  const getPrice = useCallback((assetId: string): number | undefined => {
    return prices.get(assetId);
  }, [prices]);

  const getHistory = useCallback((assetId: string): { time: number; price: number }[] => {
    return priceHistory.get(assetId) || [];
  }, [priceHistory]);

  return { prices, connected, getPrice, getHistory };
}
