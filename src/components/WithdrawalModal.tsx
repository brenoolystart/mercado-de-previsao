import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useWallet } from '@/hooks/useWallet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowDownLeft } from 'lucide-react';

interface WithdrawalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function WithdrawalModal({ open, onOpenChange, onSuccess }: WithdrawalModalProps) {
  const { wallet } = useWallet();
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 10) {
      toast({ title: 'Valor mínimo: R$ 10,00', variant: 'destructive' });
      return;
    }
    if (!pixKey.trim()) {
      toast({ title: 'Informe a chave PIX', variant: 'destructive' });
      return;
    }
    if (wallet && numAmount > wallet.balance) {
      toast({ title: 'Saldo insuficiente', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-withdrawal', {
        body: { amount: numAmount, pixKey: pixKey.trim(), pixKeyType },
      });

      if (error || data?.error) {
        toast({ title: data?.error || 'Erro ao solicitar saque', variant: 'destructive' });
      } else {
        toast({ title: 'Saque solicitado com sucesso! Aguarde aprovação.' });
        setAmount('');
        setPixKey('');
        onOpenChange(false);
        onSuccess();
      }
    } catch {
      toast({ title: 'Erro ao solicitar saque', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDownLeft className="h-5 w-5" />
            Solicitar Saque via PIX
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-3 rounded-lg bg-secondary">
            <p className="text-sm text-muted-foreground">Saldo disponível</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(wallet?.balance || 0)}</p>
          </div>

          <div className="space-y-2">
            <Label>Valor do saque</Label>
            <Input
              type="number"
              placeholder="Mínimo R$ 10,00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              min={10}
              step={0.01}
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de chave PIX</Label>
            <Select value={pixKeyType} onValueChange={setPixKeyType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpf">CPF</SelectItem>
                <SelectItem value="cnpj">CNPJ</SelectItem>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="telefone">Telefone</SelectItem>
                <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Chave PIX</Label>
            <Input
              placeholder="Sua chave PIX"
              value={pixKey}
              onChange={e => setPixKey(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Solicitar Saque
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            O saque será processado em até 24h úteis após aprovação.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
