import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Loader2, CheckCircle, KeyRound } from 'lucide-react';
import logoLight from '@/assets/logo.png';
import logoDark from '@/assets/logo-dark.png';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDark } = useDarkMode();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if we have a recovery token in the URL hash
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    
    // Listen for auth state change (recovery event)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
    });

    setChecking(false);

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }

    if (password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      setSuccess(true);
      toast({ title: 'Senha atualizada!', description: 'Sua senha foi redefinida com sucesso.' });
      setTimeout(() => navigate('/login'), 3000);
    }
    setLoading(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-lg p-8 shadow-lg">
          <div className="flex justify-center mb-6">
            <Link to="/"><img src={isDark ? logoDark : logoLight} alt="OnChoice" className="h-10" /></Link>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">Senha Atualizada!</h1>
              <p className="text-muted-foreground">Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <KeyRound className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Redefinir Senha</h1>
                <p className="text-muted-foreground">
                  {isRecovery ? 'Digite sua nova senha abaixo.' : 'Acesse este link pelo email de recuperação.'}
                </p>
              </div>

              {isRecovery ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Nova Senha</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Atualizando...</> : 'Redefinir Senha'}
                  </Button>
                </form>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">Este link é inválido ou expirou. Solicite um novo link de recuperação.</p>
                  <Button variant="outline" onClick={() => navigate('/login')}>Voltar ao Login</Button>
                </div>
              )}
            </>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">← Voltar ao login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
