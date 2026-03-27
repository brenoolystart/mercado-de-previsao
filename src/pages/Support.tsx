import { useState } from 'react';
import { Header } from '@/components/Header';
import { MobileHotbar } from '@/components/MobileHotbar';
import { Footer } from '@/components/Footer';
import { useDarkMode } from '@/hooks/useDarkMode';
import { MessageCircle, Mail, HelpCircle, ChevronDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const faqs = [
  { q: 'Como funciona o mercado de previsões?', a: 'Você compra ações de "Sim" ou "Não" em eventos futuros. Se o evento acontece conforme sua previsão, você recebe o payout. O preço reflete a probabilidade do mercado.' },
  { q: 'Como deposito fundos?', a: 'Acesse sua carteira e use o botão "Depositar". Aceitamos depósitos via PIX que são processados instantaneamente.' },
  { q: 'Quando recebo meus ganhos?', a: 'Quando um mercado é resolvido, os ganhos são automaticamente creditados na sua carteira.' },
  { q: 'O que são códigos promocionais?', a: 'São códigos que dão bônus na sua carteira. Acesse a página de Recompensas para resgatar.' },
  { q: 'Como funciona o modo demo?', a: 'O modo demo permite apostar com dinheiro virtual para você aprender sem risco.' },
];

const Support = () => {
  const { isDark, toggleDarkMode } = useDarkMode();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Preencha todos os campos.');
      return;
    }
    toast.success('Mensagem enviada com sucesso! Entraremos em contato em breve.');
    setName(''); setEmail(''); setMessage('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <MessageCircle className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Apoiar / Suporte</h1>
        </div>

        <div className="mb-8">
          <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2"><HelpCircle className="w-5 h-5 text-primary" /> Perguntas Frequentes</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <Collapsible key={i}>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card border border-border rounded-xl text-left hover:bg-muted transition-colors">
                  <span className="font-medium text-foreground text-sm">{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                </CollapsibleTrigger>
                <CollapsibleContent className="px-4 pb-4 pt-2">
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Enviar Mensagem</h2>
          <div className="space-y-3">
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" />
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="Seu e-mail" type="email" />
            <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Descreva sua dúvida ou problema..." rows={4} />
            <Button onClick={handleSubmit} className="w-full">Enviar Mensagem</Button>
          </div>
        </div>
      </main>
      <Footer />
      <MobileHotbar />
    </div>
  );
};

export default Support;
