import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Gift, Tag, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Rewards = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { user } = useAuthContext();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [redemptions, setRedemptions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('bonus_redemptions').select('*, promo_bonuses(code, description, amount, percentage)').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data }) => {
      setRedemptions(data || []);
    });
  }, [user]);

  const handleRedeem = async () => {
    if (!user || !code.trim()) return;
    setLoading(true);

    const { data: bonus } = await supabase.from('promo_bonuses').select('*').eq('code', code.trim().toUpperCase()).eq('is_active', true).single();

    if (!bonus) { toast.error('Código inválido ou expirado.'); setLoading(false); return; }
    if (bonus.used_count >= bonus.max_uses) { toast.error('Código já atingiu o limite de usos.'); setLoading(false); return; }

    const { data: existing } = await supabase.from('bonus_redemptions').select('id').eq('bonus_id', bonus.id).eq('user_id', user.id).single();
    if (existing) { toast.error('Você já resgatou este código.'); setLoading(false); return; }

    const amount = bonus.amount || 0;
    await supabase.from('bonus_redemptions').insert({ bonus_id: bonus.id, user_id: user.id, amount });

    const { data: wallet } = await supabase.from('wallets').select('id, balance').eq('user_id', user.id).single();
    if (wallet) {
      await supabase.from('wallets').update({ balance: wallet.balance + amount }).eq('id', wallet.id);
      await supabase.from('transactions').insert({ user_id: user.id, wallet_id: wallet.id, type: 'bonus', amount, balance_after: wallet.balance + amount, description: `Bônus: ${bonus.code}` });
    }

    toast.success(`Código resgatado! R$ ${amount.toFixed(2)} adicionado à sua carteira.`);
    setCode('');
    setLoading(false);

    const { data: updated } = await supabase.from('bonus_redemptions').select('*, promo_bonuses(code, description, amount, percentage)').eq('user_id', user.id).order('created_at', { ascending: false });
    setRedemptions(updated || []);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <Gift className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Recompensas</h1>
        </div>

        {user ? (
          <>
            <div className="bg-card border border-border rounded-2xl p-6 mb-6">
              <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Tag className="w-5 h-5 text-primary" /> Resgatar Código Promocional</h2>
              <p className="text-sm text-muted-foreground mb-4">Insira um código promocional para receber bônus na sua carteira.</p>
              <div className="flex gap-2">
                <Input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="Ex: WELCOME50" className="flex-1 font-mono tracking-wider" />
                <Button onClick={handleRedeem} disabled={loading || !code.trim()}>{loading ? 'Resgatando...' : 'Resgatar'}</Button>
              </div>
            </div>

            <h2 className="font-semibold text-foreground mb-3">Histórico de Resgates</h2>
            {redemptions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Gift className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>Nenhum resgate realizado.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {redemptions.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{r.promo_bonuses?.code || 'Código'}</p>
                      <p className="text-xs text-muted-foreground">{r.promo_bonuses?.description || ''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">+R$ {r.amount?.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-40" />
            <p className="text-muted-foreground mb-4">Faça login para acessar recompensas.</p>
            <Button onClick={() => window.location.href = '/login'}>Entrar</Button>
          </div>
        )}
      </main>
      <Footer />
      <MobileHotbar />
    </div>
  );
};

export default Rewards;
