import { forwardRef, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PredictionMarket } from '@/hooks/useNews';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getSportsOptionPair, inferSportFromMarket } from '@/lib/sports';
import { getLabelInitials } from '@/lib/sports-meta';
import { getOptionImageSource, proxyImage } from '@/lib/image-overrides';

interface SportsTradePanelProps {
  market: PredictionMarket | null;
}

function formatBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function getAbbr(label: string) {
  const cleaned = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/).filter(Boolean);
  return (cleaned.length > 1 ? cleaned[cleaned.length - 1] : cleaned[0] || label).toUpperCase().slice(0, 4);
}

export const SportsTradePanel = forwardRef<HTMLDivElement, SportsTradePanelProps>(function SportsTradePanel({ market }: SportsTradePanelProps, ref) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { wallet, bets, placeBet, sellPosition } = useWallet();
  const { toast } = useToast();
  const [tradeTab, setTradeTab] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [amountStr, setAmountStr] = useState('0');
  const [limitPrice, setLimitPrice] = useState('');

  useEffect(() => {
    setTradeTab('buy');
    setSelectedIndex(0);
    setAmountStr('0');
  }, [market?.id]);

  const openMarket = () => {
    if (!market) return;
    if (market.isMultiOption && market.options?.length) {
      const params = new URLSearchParams({
        id: market.id,
        title: encodeURIComponent(market.question),
        image: encodeURIComponent(market.imageUrl),
        volume: market.volume.toString(),
        options: encodeURIComponent(JSON.stringify(market.options)),
      });
      if (market.endDate) params.set('endDate', market.endDate);
      navigate(`/market-detail?${params.toString()}`);
      return;
    }
    const params = new URLSearchParams({
      id: market.id,
      title: encodeURIComponent(market.question),
      yes: market.yesPrice.toString(),
      image: encodeURIComponent(market.imageUrl),
    });
    if (market.outcomeLabels) params.set('outcomeLabels', encodeURIComponent(JSON.stringify(market.outcomeLabels)));
    if (market.endDate) params.set('endDate', market.endDate);
    if (market.clobTokenIds?.[0]) params.set('tokenId', market.clobTokenIds[0]);
    if (market.volume) params.set('volume', market.volume.toString());
    if (market.category) params.set('category', market.category);
    navigate(`/market?${params.toString()}`);
  };

  const tradeOptions = useMemo(() => {
    if (!market) return [] as Array<{ label: string; price: number; icon?: string; image?: string; position: string }>;
    const pair = getSportsOptionPair(market);
    if (pair) {
      return pair.map((option, index) => ({
        label: option.label,
        price: option.price,
        icon: option.icon,
        image: option.image,
        position: index === 0 ? 'yes' : 'no',
      }));
    }
    // Handle multi-option markets (any number of options)
    if (market.isMultiOption && market.options?.length) {
      return market.options.map((option, index) => ({
        label: option.label,
        price: option.price,
        icon: option.icon,
        image: option.image,
        position: index === 0 ? 'yes' : index === 1 ? 'no' : `option_${index}`,
      }));
    }
    if (market.isMultiOption) return [];
    const labels = market.outcomeLabels?.length === 2 ? market.outcomeLabels : ['Sim', 'Não'];
    return [
      { label: labels[0], price: market.yesPrice, position: 'yes' },
      { label: labels[1], price: market.noPrice, position: 'no' },
    ];
  }, [market]);

  const selectedOption = tradeOptions[selectedIndex] || null;
  const amount = Number.parseFloat(amountStr.replace(',', '.')) || 0;
  const myPositions = market ? bets.filter((bet) => bet.market_id === market.id && bet.status === 'pending') : [];

  const handleBuy = async () => {
    if (!market || !selectedOption) return;
    if (!isAuthenticated) {
      toast({ title: 'É preciso fazer login', variant: 'destructive' });
      navigate('/login');
      return;
    }
    if (!wallet) {
      toast({ title: 'Carteira não encontrada', variant: 'destructive' });
      return;
    }
    if (amount <= 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' });
      return;
    }
    if (amount > wallet.balance) {
      toast({ title: 'Saldo insuficiente', variant: 'destructive' });
      return;
    }
    const result = await placeBet(market.id, market.question, selectedOption.position as 'yes' | 'no', amount, selectedOption.price);
    if (result.success) {
      toast({ title: 'Palpite enviado', description: `${formatBRL(amount)} em ${selectedOption.label}.` });
    } else {
      toast({ title: 'Erro no palpite', description: result.error, variant: 'destructive' });
    }
  };

  const handleSell = async (betId: string, sellAmount: number) => {
    const result = await sellPosition(betId, sellAmount);
    if (result.success) {
      toast({ title: 'Posição vendida', description: `Você recebeu ${formatBRL(result.sellValue || 0)}.` });
    } else {
      toast({ title: 'Erro na venda', description: result.error, variant: 'destructive' });
    }
  };

  if (!market) {
    return (
      <div className="pm-trade-card pm-trade-empty">
        <p className="text-sm text-muted-foreground">Selecione um mercado para negociar</p>
      </div>
    );
  }

  const title = tradeOptions.length === 2
    ? `${getAbbr(tradeOptions[0].label)} vs ${getAbbr(tradeOptions[1].label)}`
    : market.question;
  const subtitle = market.seriesTitle || inferSportFromMarket(market)?.label || 'Esportes';
  const leadingImage = getOptionImageSource(tradeOptions[selectedIndex], market.imageUrl)
    || getOptionImageSource(tradeOptions[0], market.imageUrl)
    || market.imageUrl;

  // Find label for a bet position
  const getLabelForPosition = (position: string) => {
    const match = tradeOptions.find(o => o.position === position);
    if (match) return match.label;
    if (position === 'yes') return tradeOptions[0]?.label || 'Sim';
    if (position === 'no') return tradeOptions[1]?.label || 'Não';
    return position;
  };

  return (
    <div ref={ref} className="pm-trade-card">
      <div className="pm-trade-head">
        {leadingImage ? (
          <img src={proxyImage(leadingImage)} alt={title} className="pm-trade-team-logo" loading="lazy" />
        ) : (
          <span className="pm-trade-team-fallback">{getLabelInitials(title)}</span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-foreground">{title}</h3>
          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div className="pm-trade-toolbar">
        <div className="pm-trade-tabs">
          <button type="button" onClick={() => setTradeTab('buy')} className={cn('pm-trade-tab', tradeTab === 'buy' && 'pm-trade-tab-active')}>
            Comprar
          </button>
          <button type="button" onClick={() => setTradeTab('sell')} className={cn('pm-trade-tab', tradeTab === 'sell' && 'pm-trade-tab-active')}>
            Vender
          </button>
        </div>
        <button type="button" onClick={openMarket} className="pm-trade-market-link">Mercado</button>
      </div>

      {/* Order type selector */}
      <div className="flex gap-1 mx-4 mb-2">
        <button type="button" onClick={() => setOrderType('market')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${orderType === 'market' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Mercado</button>
        <button type="button" onClick={() => setOrderType('limit')} className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${orderType === 'limit' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Limite</button>
      </div>

      {tradeOptions.length > 0 ? (
        <>
          <div className={cn('pm-trade-outcomes', tradeOptions.length > 4 && 'pm-trade-outcomes-scroll')}>
            {tradeOptions.map((option, index) => {
              const pct = Math.round(option.price * 100);
              const isActive = selectedIndex === index;
              const optionImage = getOptionImageSource(option, market.imageUrl);
              return (
                <button
                  key={`${market.id}-${option.label}-${index}`}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={cn('pm-trade-outcome-btn', isActive ? 'pm-trade-outcome-active' : 'pm-trade-outcome-idle')}
                >
                  <div className="pm-trade-outcome-bar" style={{ width: `${pct}%` }} />
                  <div className="pm-trade-outcome-content">
                    <div className="flex items-center gap-2 min-w-0">
                      {optionImage ? (
                        <img src={proxyImage(optionImage)} alt={option.label} className="pm-trade-option-img" loading="lazy" />
                      ) : (
                        <span className="pm-trade-option-initials">{getLabelInitials(option.label)}</span>
                      )}
                      <span className="truncate">{option.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span className="pm-trade-option-pct">{pct}%</span>
                      <span className="pm-trade-option-price">R${option.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {tradeTab === 'buy' ? (
            <>
              <div className="pm-trade-amount-section">
                <div className="flex items-center justify-between text-sm font-medium text-foreground">
                  <span>Valor</span>
                  <span className="text-xs text-muted-foreground">Saldo {formatBRL(wallet?.balance || 0)}</span>
                </div>
                <div className="pm-trade-amount-box">
                  <span className="pm-trade-currency">R$</span>
                  <Input
                    value={amountStr}
                    onChange={(event) => setAmountStr(event.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                    className="pm-trade-amount-input"
                    aria-label="Valor do palpite"
                  />
                </div>
              </div>

              <div className="pm-trade-quick-row">
                {[10, 50, 100, 500].map((value) => (
                  <button key={value} type="button" className="pm-trade-quick-btn" onClick={() => setAmountStr(String(value))}>
                    +R${value}
                  </button>
                ))}
                <button type="button" className="pm-trade-quick-btn" onClick={() => wallet && setAmountStr(String(Math.floor(wallet.balance)))}>
                  Máx
                </button>
              </div>

              {/* Limit price input */}
              {orderType === 'limit' && (
                <div className="mx-4 mb-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Preço limite</label>
                  <div className="pm-trade-amount-box">
                    <span className="text-lg font-semibold text-muted-foreground/50">R$</span>
                    <Input
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      inputMode="decimal"
                      placeholder={selectedOption ? selectedOption.price.toFixed(2) : '0.50'}
                      className="pm-trade-amount-input text-lg"
                      aria-label="Preço limite"
                    />
                  </div>
                </div>
              )}

              {amount > 0 && selectedOption && (
                <div className="mx-4 mb-2 rounded-xl border border-border p-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shares a receber</span>
                    <span className="font-semibold text-foreground">{(amount / selectedOption.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço médio</span>
                    <span className="font-semibold text-foreground">R${selectedOption.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Retorno potencial</span>
                    <span className="font-semibold" style={{ color: 'hsl(152, 69%, 50%)' }}>
                      {formatBRL(amount / selectedOption.price)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ROI potencial</span>
                    <span className="font-semibold" style={{ color: 'hsl(152, 69%, 50%)' }}>
                      +{(((amount / selectedOption.price) / amount - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}

              <div className="px-4 pb-4 pt-2">
                <button type="button" onClick={handleBuy} className="pm-trade-cta">
                  Palpitar
                </button>
              </div>
            </>
          ) : myPositions.length > 0 ? (
            <div className="space-y-2 px-4 pb-4 pt-2">
              {myPositions.map((bet) => (
                <div key={bet.id} className="pm-trade-position-row">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{getLabelForPosition(bet.position)}</p>
                    <p className="text-xs text-muted-foreground">{formatBRL(bet.amount)}</p>
                  </div>
                  <button type="button" className="pm-trade-quick-btn" onClick={() => handleSell(bet.id, bet.amount)}>
                    Vender
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Nenhuma posição aberta neste mercado.</p>
          )}
        </>
      ) : (
        <div className="p-4">
          <p className="mb-3 text-sm text-muted-foreground">Este mercado tem múltiplas opções.</p>
          <button type="button" onClick={openMarket} className="pm-trade-cta">Abrir mercado completo</button>
        </div>
      )}

      <p className="px-4 pb-4 text-center text-[11px] text-muted-foreground">
        Ao negociar, você concorda com os <button type="button" className="underline" onClick={() => navigate('/terms')}>Termos de Uso</button>.
      </p>
    </div>
  );
});

SportsTradePanel.displayName = 'SportsTradePanel';
