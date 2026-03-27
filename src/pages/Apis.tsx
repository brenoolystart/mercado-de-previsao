import { Header } from '@/components/Header';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { useDarkMode } from '@/hooks/useDarkMode';
import { Plug, Copy, ExternalLink, Code2, Zap, Database, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const endpoints = [
  { method: 'GET', path: '/api/markets', description: 'Lista todos os mercados ativos com preços atualizados.', icon: BarChart3 },
  { method: 'GET', path: '/api/markets/:id', description: 'Detalhes de um mercado específico incluindo order book.', icon: Database },
  { method: 'GET', path: '/api/prices/:symbol', description: 'Preço atual de criptomoedas (BTC, ETH, etc).', icon: Zap },
  { method: 'POST', path: '/api/bets', description: 'Criar uma nova aposta em um mercado (requer autenticação).', icon: Code2 },
];

const Apis = () => {
  const { isDark, toggleDarkMode } = useDarkMode();

  const copyEndpoint = (path: string) => {
    navigator.clipboard.writeText(`https://onchoice.com.br${path}`);
    toast.success('Endpoint copiado!');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-2">
          <Plug className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">APIs</h1>
        </div>
        <p className="text-muted-foreground mb-6">Integre mercados de previsão na sua aplicação com nossa API REST.</p>

        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Code2 className="w-5 h-5 text-primary" /> Início Rápido</h2>
          <div className="bg-secondary rounded-xl p-4 font-mono text-sm text-foreground overflow-x-auto">
            <pre>{`curl -X GET "https://onchoice.com.br/api/markets" \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -H "Content-Type: application/json"`}</pre>
          </div>
        </div>

        <h2 className="font-semibold text-foreground mb-3">Endpoints Disponíveis</h2>
        <div className="space-y-3">
          {endpoints.map((ep, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <ep.icon className="w-5 h-5 text-primary shrink-0" />
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${ep.method === 'GET' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>{ep.method}</span>
                <code className="text-sm font-mono text-foreground flex-1">{ep.path}</code>
                <button onClick={() => copyEndpoint(ep.path)} className="text-muted-foreground hover:text-primary transition-colors">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground pl-8">{ep.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-2xl p-5 text-center">
          <p className="text-sm text-muted-foreground mb-3">Documentação completa e geração de chaves API em breve.</p>
          <Button variant="outline" disabled className="gap-2"><ExternalLink className="w-4 h-4" /> Em Breve</Button>
        </div>
      </main>
      <Footer />
      <MobileHotbar />
    </div>
  );
};

export default Apis;
