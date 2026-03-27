import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useWallet } from '@/hooks/useWallet';
import { useToast } from '@/hooks/use-toast';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@/components/ui/drawer';

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface MobileTradeBarProps {
  marketId: string;
  title: string;
  imageUrl?: string;
  yesPrice: number;
  yesLabel?: string;
  noLabel?: string;
  selectedOptionLabel?: string;
  selectedOptionImage?: string;
  selectedOptionPrice?: number;
  onTrade?: (position: string, amount: number) => Promise<void>;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialPosition?: 'yes' | 'no';
}

export function MobileTradeBar({
  marketId,
  title,
  imageUrl,
  yesPrice,
  yesLabel = 'Sim',
  noLabel = 'Não',
  selectedOptionLabel,
  selectedOptionImage,
  selectedOptionPrice,
  onTrade,
  isOpen,
  onOpenChange,
  initialPosition,
}: MobileTradeBarProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const { wallet, placeBet, loading: walletLoading } = useWallet();
  const { toast } = useToast();

  // Support both controlled and uncontrolled mode
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const [position, setPosition] = useState<'yes' | 'no'>(initialPosition || 'yes');
  const [amountStr, setAmountStr] = useState('10');
  const [isPlacing, setIsPlacing] = useState(false);

  // Sync position from parent
  useEffect(() => {
    if (initialPosition) setPosition(initialPosition);
  }, [initialPosition]);

  const noPrice = 1 - yesPrice;
  const amount = parseFloat(amountStr) || 0;
  const effectivePrice = selectedOptionPrice
    ? (position === 'yes' ? selectedOptionPrice : 1 - selectedOptionPrice)
    : (position === 'yes' ? yesPrice : noPrice);
  const effectiveReturn = amount / effectivePrice;
  const shares = amount / effectivePrice;
  const roi = amount > 0 ? ((effectiveReturn / amount) - 1) * 100 : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) setAmountStr(val);
  };

  const handleTrade = async () => {
    if (!isAuthenticated) {
      toast({ title: 'Login necessário', variant: 'destructive' });
      navigate('/login');
      return;
    }
    if (!wallet) {
      toast({ title: 'Carteira não encontrada', variant: 'destructive' });
      return;
    }
    if (amount > wallet.balance) {
      toast({ title: 'Saldo insuficiente', variant: 'destructive' });
      return;
    }
    if (amount <= 0) {
      toast({ title: 'Valor inválido', variant: 'destructive' });
      return;
    }

    setIsPlacing(true);

    if (onTrade) {
      await onTrade(position, amount);
    } else {
      const posLabel = selectedOptionLabel || (position === 'yes' ? yesLabel : noLabel);
      const result = await placeBet(marketId, title, position, amount, effectivePrice);
      if (result.success) {
        toast({ title: 'Palpite registrado!', description: `${formatBRL(amount)} em ${posLabel}.` });
        setOpen(false);
      } else {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
      }
    }

    setIsPlacing(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerTitle className="sr-only">Negociar</DrawerTitle>
        <div className="px-5 pt-2 pb-6 space-y-3 overflow-y-auto">
          {/* Market info header */}
          <div className="flex items-center gap-3">
            {(selectedOptionImage || imageUrl) && (
              <img
                src={selectedOptionImage || imageUrl}
                alt=""
                className="w-10 h-10 rounded-xl object-cover border border-border shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground line-clamp-2 leading-tight">
                {selectedOptionLabel || title}
              </p>
            </div>
          </div>

          {/* Yes/No toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setPosition('yes')}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                backgroundColor: position === 'yes' ? 'hsl(152, 69%, 45%)' : 'hsla(152, 69%, 45%, 0.12)',
                color: position === 'yes' ? '#fff' : 'hsl(152, 69%, 50%)',
              }}
            >
              {yesLabel} R${yesPrice.toFixed(2)}
            </button>
            <button
              onClick={() => setPosition('no')}
              className="flex-1 py-3 rounded-xl font-bold text-sm transition-all"
              style={{
                backgroundColor: position === 'no' ? 'hsl(0, 72%, 55%)' : 'hsla(0, 72%, 51%, 0.12)',
                color: position === 'no' ? '#fff' : 'hsl(0, 72%, 60%)',
              }}
            >
              {noLabel} R${noPrice.toFixed(2)}
            </button>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-medium text-foreground">Quantidade</span>
              <span className="text-xs text-muted-foreground">
                Saldo {wallet ? formatBRL(wallet.balance) : 'R$ 0,00'}
              </span>
            </div>
            <div className="flex items-baseline justify-center py-3">
              <span className="text-muted-foreground text-2xl font-semibold">R$</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={handleAmountChange}
                onBlur={() => {
                  if (amountStr === '' || amount <= 0) setAmountStr('10');
                }}
                className="bg-transparent text-4xl font-bold text-foreground text-center outline-none w-28 tabular-nums"
                style={{ caretColor: 'hsl(var(--primary))' }}
              />
            </div>
            <div className="flex gap-1.5">
              {[1, 5, 10, 100].map((val) => (
                <button
                  key={val}
                  onClick={() => setAmountStr(String(amount + val))}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-secondary hover:bg-muted transition-colors text-foreground"
                >
                  +R${val}
                </button>
              ))}
              <button
                onClick={() => wallet && setAmountStr(String(Math.floor(wallet.balance)))}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-secondary hover:bg-muted transition-colors text-foreground"
              >
                Max
              </button>
            </div>
          </div>

          {/* Order stats */}
          {amount > 0 && (
            <div className="rounded-xl p-3 space-y-1.5 text-sm border border-border">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shares a receber</span>
                <span className="font-semibold text-foreground">{shares.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Preço médio</span>
                <span className="font-semibold text-foreground">R${effectivePrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Retorno potencial</span>
                <span className="font-semibold" style={{ color: 'hsl(152, 69%, 50%)' }}>
                  {formatBRL(effectiveReturn)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ROI potencial</span>
                <span className="font-semibold" style={{ color: 'hsl(152, 69%, 50%)' }}>
                  +{roi.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Trade button */}
          <Button
            className="w-full text-sm font-bold rounded-xl"
            onClick={handleTrade}
            disabled={isPlacing || walletLoading}
            style={{
              backgroundColor: position === 'yes' ? 'hsl(152, 69%, 45%)' : 'hsl(0, 72%, 55%)',
              color: '#fff',
              height: '52px',
            }}
          >
            {isPlacing
              ? 'Processando...'
              : `Palpitar ${position === 'yes' ? 'Sim' : 'Não'} em ${selectedOptionLabel || (position === 'yes' ? yesLabel : noLabel)}`}
          </Button>

          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground text-center">
              Você precisa{' '}
              <Link to="/login" className="text-primary hover:underline">
                entrar
              </Link>{' '}
              para negociar
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
