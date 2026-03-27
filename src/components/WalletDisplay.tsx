import { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, History, FlaskConical, Plus } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { useDemoContext } from '@/contexts/DemoContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DepositModal } from '@/components/DepositModal';
import { WithdrawalModal } from '@/components/WithdrawalModal';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const transactionTypeLabels: Record<string, string> = {
  deposit: 'Depósito',
  withdrawal: 'Saque',
  bet_placed: 'Palpite',
  bet_won: 'Ganho',
  bet_lost: 'Perda',
  refund: 'Reembolso',
  bonus: 'Bônus',
};

const betStatusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  won: { label: 'Ganhou', variant: 'default' },
  lost: { label: 'Perdeu', variant: 'destructive' },
  cancelled: { label: 'Cancelado', variant: 'outline' },
  refunded: { label: 'Reembolsado', variant: 'outline' },
};

export function WalletDisplay() {
  const { wallet, transactions, bets, loading, refetch } = useWallet();
  const { demoState } = useDemoContext();
  const { isEnabled } = useFeatureFlags();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawalOpen, setWithdrawalOpen] = useState(false);

  if (loading || !wallet) {
    return null;
  }

  const isDemo = demoState.isActive;
  const displayBalance = isDemo ? demoState.balance : wallet.balance;
  const lockedInBets = bets
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <>
    <Dialog>
      <DialogTrigger asChild>
        <div className={`flex items-center gap-3 text-sm cursor-pointer`}>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start">
              <span className="text-[11px] text-muted-foreground leading-none">Portfolio</span>
              <span className="font-bold text-green text-sm leading-tight">{formatCurrency(lockedInBets)}</span>
            </div>
            <div className="flex flex-col items-start hidden md:flex">
              <span className="text-[11px] text-muted-foreground leading-none">Caixa</span>
              <span className="font-bold text-green text-sm leading-tight">{formatCurrency(displayBalance)}</span>
            </div>
          </div>
          {isDemo && <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-500/50">DEMO</Badge>}
          {!isDemo && isEnabled('feature_deposits') && (
            <button
              onClick={(e) => { e.stopPropagation(); setDepositOpen(true); }}
              className="px-5 py-2 text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors rounded-lg"
            >
              Depósito
            </button>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDemo ? <FlaskConical className="h-5 w-5 text-amber-500" /> : <Wallet className="h-5 w-5" />}
            {isDemo ? 'Carteira Demo' : 'Minha Carteira'}
            {isDemo && (
              <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 text-xs ml-2">
                {demoState.daysRemaining}d restantes
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className={`rounded-lg p-4 ${isDemo ? 'bg-amber-500/10 border border-amber-500/30' : 'bg-secondary'}`}>
            <div className="text-sm text-muted-foreground mb-1">
              {isDemo ? 'Saldo Demo' : 'Saldo Disponível'}
            </div>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(displayBalance)}
            </div>
          </div>
          <div className="bg-secondary rounded-lg p-4">
            <div className="text-sm text-muted-foreground mb-1">Total Ganho</div>
            <div className="text-2xl font-bold text-green flex items-center gap-1">
              <TrendingUp className="h-5 w-5" />
              {formatCurrency(wallet.total_won)}
            </div>
          </div>
        </div>

        {!isDemo && (
          <div className="flex gap-2">
            {isEnabled('feature_deposits') && (
              <Button onClick={() => setDepositOpen(true)} className="flex-1 gap-2" variant="default">
                <Plus className="h-4 w-4" />
                Depositar
              </Button>
            )}
            {isEnabled('feature_withdrawals') && (
              <Button onClick={() => setWithdrawalOpen(true)} className="flex-1 gap-2" variant="outline">
                <TrendingDown className="h-4 w-4" />
                Sacar
              </Button>
            )}
          </div>
        )}

        <Tabs defaultValue="bets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bets">Meus Palpites</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="bets" className="mt-4">
            <ScrollArea className="h-[250px]">
              {bets.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum palpite ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bets.map((bet) => {
                    const status = betStatusLabels[bet.status];
                    return (
                      <div
                        key={bet.id}
                        className="bg-card border border-border rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-foreground line-clamp-2">
                            {bet.market_title}
                          </p>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {bet.position === 'yes' ? 'Sim' : 'Não'} a{' '}
                            {Math.round(bet.price_at_bet * 100)}%
                          </span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(bet.amount)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Potencial: {formatCurrency(bet.potential_payout)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <ScrollArea className="h-[250px]">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma transação ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {transactionTypeLabels[tx.type] || tx.type}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(tx.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-semibold ${
                            tx.amount >= 0 ? 'text-green' : 'text-red'
                          }`}
                        >
                          {tx.amount >= 0 ? '+' : ''}
                          {formatCurrency(tx.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Saldo: {formatCurrency(tx.balance_after)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    <DepositModal
      open={depositOpen}
      onOpenChange={setDepositOpen}
      onSuccess={refetch}
    />

    <WithdrawalModal
      open={withdrawalOpen}
      onOpenChange={setWithdrawalOpen}
      onSuccess={refetch}
    />
    </>
  );
}
