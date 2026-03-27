import { Header } from '@/components/Header';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { useDarkMode } from '@/hooks/useDarkMode';
import { FileText, BookOpen, Layers, ShieldCheck, Coins, BarChart3, Users } from 'lucide-react';

const sections = [
  {
    icon: BookOpen, title: 'O que é OnChoice?',
    content: 'OnChoice é uma plataforma de mercado de previsões onde você pode dar palpites em eventos reais. Os preços das ações refletem a probabilidade coletiva de um evento acontecer.',
  },
  {
    icon: Coins, title: 'Como Funcionam os Palpites',
    content: 'Cada mercado tem ações de "Sim" e "Não". Se você acredita que um evento vai acontecer, compre "Sim". O preço varia de R$0.01 a R$0.99, representando a probabilidade. Se o evento ocorre, cada ação "Sim" vale R$1.00.',
  },
  {
    icon: BarChart3, title: 'Entendendo os Preços',
    content: 'O preço de uma ação indica a probabilidade estimada pelo mercado. Um preço de 0.65 para "Sim" significa que o mercado acredita em ~65% de chance do evento acontecer. Preços são atualizados em tempo real.',
  },
  {
    icon: Layers, title: 'Mercados Multi-Opção',
    content: 'Alguns mercados têm múltiplas opções (ex: "Quem vai ganhar a eleição?"). Cada opção tem seu próprio preço e probabilidade. A soma de todas as opções deve ser aproximadamente 100%.',
  },
  {
    icon: ShieldCheck, title: 'Resolução de Mercados',
    content: 'Quando o evento ocorre, o mercado é resolvido. As ações vencedoras pagam R$1.00 cada e as perdedoras pagam R$0.00. Os ganhos são creditados automaticamente na sua carteira.',
  },
  {
    icon: Users, title: 'Modo Demo',
    content: 'Ative o modo demo para praticar com dinheiro virtual. Você recebe R$10.000 em créditos demo para testar estratégias sem risco antes de palpitar com dinheiro real.',
  },
];

const Docs = () => {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Documentação</h1>
        </div>

        <div className="space-y-4">
          {sections.map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">{s.title}</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
      <MobileHotbar />
    </div>
  );
};

export default Docs;
