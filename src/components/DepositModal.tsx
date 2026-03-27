import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Copy, CheckCircle2, QrCode, Clock, AlertCircle, Bitcoin, DollarSign, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { ReCaptchaWidget, ReCaptchaBadge } from '@/components/ReCaptcha';
import { AgeVerificationCamera } from '@/components/AgeVerificationCamera';
import { ShieldCheck } from 'lucide-react';

interface DepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function DepositModal({ open, onOpenChange, onSuccess }: DepositModalProps) {
  const { toast } = useToast();
  const { captchaToken, setCaptchaToken, verifyCaptcha, captchaResetTrigger } = useRecaptcha();
  const [depositMethod, setDepositMethod] = useState<'pix' | 'crypto' | 'dollar' | 'card'>('pix');
  const [step, setStep] = useState<'age-verify' | 'amount' | 'qrcode' | 'confirmed'>('amount');
  const [ageVerified, setAgeVerified] = useState(() => localStorage.getItem('onchoice-age-verified') === 'true');
  const [amount, setAmount] = useState('');
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{
    deposit_id: string;
    qr_code: string;
    qr_code_base64: string;
    amount: number;
    expires_at: string;
  } | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [minDeposit, setMinDeposit] = useState(5);
  const [maxDeposit, setMaxDeposit] = useState(10000);

  const quickAmounts = [10, 25, 50, 100, 200, 500];

  useEffect(() => {
    const fetchLimits = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('key, value')
        .in('key', ['min_deposit', 'max_deposit']);
      if (data) {
        data.forEach((s: any) => {
          if (s.key === 'min_deposit') setMinDeposit(Number(s.value) || 5);
          if (s.key === 'max_deposit') setMaxDeposit(Number(s.value) || 10000);
        });
      }
    };
    if (open) fetchLimits();
  }, [open]);

  useEffect(() => {
    if (!pixData?.expires_at || step !== 'qrcode') return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expires = new Date(pixData.expires_at).getTime();
      const diff = expires - now;
      if (diff <= 0) { setTimeLeft('Expirado'); clearInterval(interval); return; }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [pixData?.expires_at, step]);

  useEffect(() => {
    if (!pixData?.deposit_id || step !== 'qrcode') return;
    const interval = setInterval(async () => {
      setCheckingStatus(true);
      const { data } = await supabase
        .from('pix_deposits')
        .select('status')
        .eq('id', pixData.deposit_id)
        .single();
      if (data?.status === 'paid' || data?.status === 'confirmed') {
        setStep('confirmed');
        clearInterval(interval);
        onSuccess?.();
      }
      setCheckingStatus(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [pixData?.deposit_id, step, onSuccess]);

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const getQrImageSrc = () => {
    if (!pixData) return '';
    const base64 = (pixData.qr_code_base64 || '').trim();
    if (base64) {
      if (base64.startsWith('data:') || base64.startsWith('http://') || base64.startsWith('https://')) return base64;
      return `data:image/png;base64,${base64.replace(/\s/g, '')}`;
    }
    if (pixData.qr_code) return `https://quickchart.io/qr?size=320&text=${encodeURIComponent(pixData.qr_code)}`;
    return '';
  };

  const handleAgeVerified = (approved: boolean) => {
    if (approved) {
      setAgeVerified(true);
      localStorage.setItem('onchoice-age-verified', 'true');
      setStep('amount');
    }
  };

  const handleGeneratePix = async () => {
    if (!ageVerified) {
      setStep('age-verify');
      return;
    }
    const numAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(numAmount) || numAmount < minDeposit) {
      toast({ title: `Valor mínimo: ${formatCurrency(minDeposit)}`, variant: 'destructive' });
      return;
    }
    if (numAmount > maxDeposit) {
      toast({ title: `Valor máximo: ${formatCurrency(maxDeposit)}`, variant: 'destructive' });
      return;
    }
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast({ title: 'CPF inválido', variant: 'destructive' });
      return;
    }

    const captchaResult = await verifyCaptcha('deposit');
    if (!captchaResult.success) {
      toast({ title: 'Verificação necessária', description: captchaResult.error, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-pix', {
        body: { amount: numAmount, document: cpfDigits },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro ao gerar PIX');
      setPixData(data);
      setStep('qrcode');
    } catch (err: any) {
      toast({ title: err.message || 'Erro ao gerar PIX', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!pixData?.qr_code) return;
    await navigator.clipboard.writeText(pixData.qr_code);
    toast({ title: 'Código PIX copiado!' });
  };

  const handleClose = () => {
    setStep('amount');
    setAmount('');
    setPixData(null);
    setDepositMethod('pix');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {depositMethod === 'pix' && <QrCode className="h-5 w-5 text-primary" />}
            {depositMethod === 'crypto' && <Bitcoin className="h-5 w-5 text-primary" />}
            {depositMethod === 'dollar' && <DollarSign className="h-5 w-5 text-primary" />}
            {depositMethod === 'card' && <CreditCard className="h-5 w-5 text-primary" />}
            {step === 'age-verify' && 'Verificação de Idade'}
            {step === 'amount' && 'Depositar'}
            {step === 'qrcode' && 'Pague o PIX'}
            {step === 'confirmed' && 'Depósito Confirmado!'}
          </DialogTitle>
        </DialogHeader>

        {step === 'age-verify' && (
          <div className="space-y-4">
            {ageVerified ? (
              <div className="flex items-center gap-2 text-green-600 p-4">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-medium">Idade verificada com sucesso ✓</span>
              </div>
            ) : (
              <AgeVerificationCamera onVerified={handleAgeVerified} />
            )}
          </div>
        )}

        {step === 'amount' && (
          <div className="space-y-6">
            {/* Deposit method tabs */}
            <Tabs value={depositMethod} onValueChange={(v) => setDepositMethod(v as any)}>
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="pix" className="gap-1 text-xs"><QrCode className="h-3.5 w-3.5" />PIX</TabsTrigger>
                <TabsTrigger value="crypto" className="gap-1 text-xs"><Bitcoin className="h-3.5 w-3.5" />Crypto</TabsTrigger>
                <TabsTrigger value="dollar" className="gap-1 text-xs"><DollarSign className="h-3.5 w-3.5" />Dólar</TabsTrigger>
                <TabsTrigger value="card" className="gap-1 text-xs"><CreditCard className="h-3.5 w-3.5" />Cartão</TabsTrigger>
              </TabsList>
            </Tabs>

            {depositMethod !== 'pix' && (
              <div className="text-center py-8 space-y-3">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  {depositMethod === 'crypto' && <Bitcoin className="h-7 w-7 text-primary" />}
                  {depositMethod === 'dollar' && <DollarSign className="h-7 w-7 text-primary" />}
                  {depositMethod === 'card' && <CreditCard className="h-7 w-7 text-primary" />}
                </div>
                <div>
                  <p className="font-semibold text-foreground">Em breve</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {depositMethod === 'crypto' && 'Depósito via Bitcoin, ETH e USDT estará disponível em breve.'}
                    {depositMethod === 'dollar' && 'Depósito em dólar via transferência internacional em breve.'}
                    {depositMethod === 'card' && 'Depósito via cartão de crédito/débito em breve.'}
                  </p>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            )}

            {depositMethod === 'pix' && (
              <>
                <div className="space-y-2">
                  <Label>Valor do depósito</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">R$</span>
                    <Input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9,\.]/g, ''))}
                      placeholder="0,00"
                      className="pl-10 text-lg font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {quickAmounts.map((val) => (
                    <Button
                      key={val}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(val.toString())}
                      className={amount === val.toString() ? 'border-primary bg-primary/10' : ''}
                    >
                      {formatCurrency(val)}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label>CPF do pagador</Label>
                  <Input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <ReCaptchaWidget onVerify={setCaptchaToken} resetTrigger={captchaResetTrigger} />

                <Button onClick={handleGeneratePix} disabled={loading || !amount || !captchaToken} className="w-full">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <QrCode className="h-4 w-4 mr-2" />}
                  {loading ? 'Gerando PIX...' : 'Gerar QR Code PIX'}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Depósito: {formatCurrency(minDeposit)} a {formatCurrency(maxDeposit)} • Crédito automático
                </p>
                <ReCaptchaBadge />
              </>
            )}
          </div>
        )}

        {step === 'qrcode' && pixData && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(pixData.amount)}</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Expira em: {timeLeft}</span>
              </div>
            </div>

            {getQrImageSrc() ? (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl">
                  <img src={getQrImageSrc()} alt="QR Code PIX" className="w-48 h-48" loading="lazy" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="bg-muted/50 rounded-xl p-8 text-center">
                  <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Use o código abaixo</p>
                </div>
              </div>
            )}

            {pixData.qr_code && (
              <div className="space-y-2">
                <Label className="text-xs">PIX Copia e Cola</Label>
                <div className="flex gap-2">
                  <Input value={pixData.qr_code} readOnly className="text-xs font-mono" />
                  <Button variant="outline" size="icon" onClick={copyToClipboard}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
              {checkingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <AlertCircle className="h-4 w-4 text-primary" />
              )}
              <p className="text-xs text-muted-foreground">Aguardando confirmação do pagamento...</p>
            </div>
          </div>
        )}

        {step === 'confirmed' && pixData && (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{formatCurrency(pixData.amount)}</p>
              <p className="text-sm text-muted-foreground mt-1">Depósito creditado com sucesso!</p>
            </div>
            <Badge variant="default" className="bg-green-500">Confirmado</Badge>
            <Button onClick={handleClose} className="w-full mt-4">Fechar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
