import { useMemo, useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrderBookProps {
  yesPrice: number;
  marketId: string;
  volume?: number;
}

interface OrderLevel {
  price: number;
  quantity: number;
  total: number;
  cumulative: number;
}

function generateOrders(
  centerPrice: number,
  marketId: string,
  side: 'buy' | 'sell',
  levels: number = 8
): OrderLevel[] {
  const seed = marketId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const orders: OrderLevel[] = [];
  let cumulative = 0;

  for (let i = 0; i < levels; i++) {
    const offset = (i + 1) * 0.01;
    const price =
      side === 'buy'
        ? Math.max(0.01, centerPrice - offset)
        : Math.min(0.99, centerPrice + offset);

    const noise = Math.abs(Math.sin(seed * (i + 1) * (side === 'buy' ? 1.3 : 2.7)));
    const quantity = Math.round(50 + noise * 500);
    cumulative += quantity;

    orders.push({
      price: Math.round(price * 100) / 100,
      quantity,
      total: Math.round(price * quantity * 100) / 100,
      cumulative,
    });
  }

  return side === 'buy' ? orders : orders;
}

function formatNumber(num: number): string {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function OrderBook({ yesPrice, marketId, volume }: OrderBookProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const buyOrders = useMemo(
    () => generateOrders(yesPrice, marketId, 'buy'),
    [yesPrice, marketId]
  );

  const sellOrders = useMemo(
    () => generateOrders(yesPrice, marketId, 'sell'),
    [yesPrice, marketId]
  );

  const maxCumulative = Math.max(
    buyOrders[buyOrders.length - 1]?.cumulative || 0,
    sellOrders[sellOrders.length - 1]?.cumulative || 0
  );

  const totalVolume = volume
    ? `R$${formatNumber(Math.round(volume))}`
    : `R$${formatNumber(
        Math.round(buyOrders.reduce((s, o) => s + o.total, 0) +
          sellOrders.reduce((s, o) => s + o.total, 0))
      )}`;

  const headerContent = (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-2">
        <h3 className="font-bold text-foreground">Livro de Ordens</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs max-w-[200px]">
                O order book mostra as ordens de compra (verde) e venda
                (vermelho) pendentes neste mercado.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {totalVolume} Vol.
        </span>
        {isMobile && (
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </div>
    </div>
  );

  const bodyContent = (
    <>
      {/* Column headers */}
      <div className="grid grid-cols-3 px-4 py-2 text-xs text-muted-foreground border-t border-border">
        <span>Preço</span>
        <span className="text-right">Qtd</span>
        <span className="text-right">Total</span>
      </div>

      {/* Sell orders (asks) */}
      <div className="divide-y divide-border/30">
        {[...sellOrders].reverse().map((order, idx) => {
          const depthPercent = (order.cumulative / maxCumulative) * 100;
          return (
            <div
              key={`sell-${idx}`}
              className="relative grid grid-cols-3 px-4 py-1.5 text-sm hover:bg-muted/30 transition-colors"
            >
              <div
                className="absolute inset-0 bg-red/10"
                style={{ width: `${depthPercent}%`, right: 0, left: 'auto' }}
              />
              <span className="relative text-red font-medium">
                {order.price.toFixed(2)}¢
              </span>
              <span className="relative text-right text-foreground">
                {formatNumber(order.quantity)}
              </span>
              <span className="relative text-right text-muted-foreground">
                R${formatNumber(order.total)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Spread / current price */}
      <div className="flex items-center justify-center py-2 border-y border-border bg-muted/20">
        <span className="text-sm font-bold text-foreground">
          {Math.round(yesPrice * 100)}¢
        </span>
        <span className="text-xs text-muted-foreground ml-2">
          Spread:{' '}
          {(
            (sellOrders[0]?.price || 0) - (buyOrders[0]?.price || 0)
          ).toFixed(2)}
          ¢
        </span>
      </div>

      {/* Buy orders (bids) */}
      <div className="divide-y divide-border/30">
        {buyOrders.map((order, idx) => {
          const depthPercent = (order.cumulative / maxCumulative) * 100;
          return (
            <div
              key={`buy-${idx}`}
              className="relative grid grid-cols-3 px-4 py-1.5 text-sm hover:bg-muted/30 transition-colors"
            >
              <div
                className="absolute inset-0 bg-green/10"
                style={{ width: `${depthPercent}%`, right: 0, left: 'auto' }}
              />
              <span className="relative text-green font-medium">
                {order.price.toFixed(2)}¢
              </span>
              <span className="relative text-right text-foreground">
                {formatNumber(order.quantity)}
              </span>
              <span className="relative text-right text-muted-foreground">
                R${formatNumber(order.total)}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {isMobile ? (
        <>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full text-left"
          >
            {headerContent}
          </button>
          {isOpen && bodyContent}
        </>
      ) : (
        <>
          <div className="border-b border-border">{headerContent}</div>
          {bodyContent}
        </>
      )}
    </div>
  );
}
