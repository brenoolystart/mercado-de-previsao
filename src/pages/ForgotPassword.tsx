import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';

export default function ForgotPassword() {
  const { toast } = useToast();
  const { isDark } = useDarkMode();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            <Link to="/"><img src={isDark ? logoDark : logoLight} alt="OnChoice" className="h-10" /></Link>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Email Enviado!</h1>
              <p className="text-muted-foreground">Verifique sua caixa de entrada em <strong>{email}</strong> e clique no link para redefinir sua senha.</p>
              <Link to="/login" className="text-sm text-primary hover:underline">← Voltar ao login</Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Esqueceu a Senha?</h1>
                <p className="text-muted-foreground">Digite seu email e enviaremos um link de recuperação.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Enviando...</> : 'Enviar Link de Recuperação'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-primary hover:underline">← Voltar ao login</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
