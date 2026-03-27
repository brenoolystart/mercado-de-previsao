import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Trash2, ImagePlus, Send, Bot, Loader2, BarChart3, 
  TrendingUp, Calendar, X, Sparkles, Upload
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface PollOption {
  label: string;
  odds?: number;
}

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AdminPolls() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pollType, setPollType] = useState<'social' | 'prediction'>('social');
  const [options, setOptions] = useState<PollOption[]>([
    { label: '', odds: 50 },
    { label: '', odds: 50 },
  ]);
  const [endDate, setEndDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // AI chat state
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Polls list
  const [polls, setPolls] = useState<any[]>([]);
  const [loadingPolls, setLoadingPolls] = useState(false);

  const fetchPolls = async () => {
    setLoadingPolls(true);
    const { data } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPolls(data);
    setLoadingPolls(false);
  };

  useState(() => { fetchPolls(); });

  const addOption = () => {
    if (options.length >= 6) return;
    setOptions([...options, { label: '', odds: 0 }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: keyof PollOption, value: string | number) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const distributeOddsEvenly = () => {
    const even = Math.round(100 / options.length);
    setOptions(options.map((o, i) => ({
      ...o,
      odds: i === options.length - 1 ? 100 - even * (options.length - 1) : even,
    })));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreate = async () => {
    if (!title.trim() || options.some(o => !o.label.trim())) {
      toast({ title: 'Preencha todos os campos', description: 'Título e todas as opções são obrigatórios.', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const ext = imageFile.name.split('.').pop();
        const path = `${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('poll-images')
          .upload(path, imageFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('poll-images').getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('polls').insert({
        title: title.trim(),
        description: description.trim() || null,
        poll_type: pollType,
        options: options.map(o => ({ label: o.label, odds: o.odds })),
        odds: pollType === 'prediction' ? options.map(o => ({ label: o.label, probability: o.odds })) : null,
        image_url: imageUrl,
        end_date: endDate || null,
        created_by: user!.id,
        status: 'active',
      });

      if (error) throw error;

      toast({ title: 'Enquete criada!', description: 'A enquete foi publicada com sucesso.' });
      setTitle('');
      setDescription('');
      setOptions([{ label: '', odds: 50 }, { label: '', odds: 50 }]);
      setEndDate('');
      removeImage();
      fetchPolls();
    } catch (err: any) {
      toast({ title: 'Erro ao criar enquete', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const sendAiMessage = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const userMsg: AiMessage = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setAiLoading(true);

    try {
      const pollData = { title, description, pollType, options, endDate };
      const { data, error } = await supabase.functions.invoke('poll-ai-assistant', {
        body: { message: aiInput, pollData },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAiMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: `❌ Erro: ${err.message}` }]);
    } finally {
      setAiLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const quickPrompts = [
    { label: '📊 Calcular odds', prompt: 'Calcule as odds justas para as opções da enquete atual e sugira os preços de cada posição.' },
    { label: '💰 Payout', prompt: 'Calcule o payout potencial para cada opção considerando as odds atuais.' },
    { label: '✍️ Sugerir título', prompt: 'Sugira 3 títulos atrativos para esta enquete baseado na descrição e opções.' },
    { label: '🔍 Analisar', prompt: 'Analise esta enquete e sugira melhorias nas opções, odds e descrição.' },
  ];

  const totalOdds = options.reduce((sum, o) => sum + (o.odds || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Create Poll */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Criar Enquete
            </CardTitle>
            <CardDescription>Crie mercados de previsão ou votações sociais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type selector */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={pollType} onValueChange={(v: 'social' | 'prediction') => setPollType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">🗳️ Votação Social</SelectItem>
                  <SelectItem value="prediction">📈 Mercado de Previsão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Quem vai ganhar o campeonato?" />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva os critérios de resolução..." rows={3} />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Imagem</Label>
              {imagePreview ? (
                <div className="relative inline-block">
                  <img src={imagePreview} alt="Preview" className="h-32 rounded-lg object-cover" />
                  <button onClick={removeImage} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <ImagePlus className="h-4 w-4" /> Adicionar imagem
                </Button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Opções</Label>
                <div className="flex gap-2">
                  {pollType === 'prediction' && (
                    <Button variant="ghost" size="sm" onClick={distributeOddsEvenly} className="text-xs">
                      Distribuir odds igualmente
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={addOption} disabled={options.length >= 6}>
                    <Plus className="h-3 w-3 mr-1" /> Opção
                  </Button>
                </div>
              </div>

              {options.map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-6">{i + 1}.</span>
                  <Input
                    value={option.label}
                    onChange={e => updateOption(i, 'label', e.target.value)}
                    placeholder={`Opção ${i + 1}`}
                    className="flex-1"
                  />
                  {pollType === 'prediction' && (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={option.odds}
                        onChange={e => updateOption(i, 'odds', Number(e.target.value))}
                        className="w-20"
                        min={1}
                        max={99}
                      />
                      <span className="text-sm text-muted-foreground">%</span>
                    </div>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => removeOption(i)} disabled={options.length <= 2}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}

              {pollType === 'prediction' && (
                <div className={`text-sm ${totalOdds === 100 ? 'text-green-500' : 'text-destructive'}`}>
                  Total: {totalOdds}% {totalOdds !== 100 && '(deve ser 100%)'}
                </div>
              )}
            </div>

            {/* End date */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Data de encerramento</Label>
              <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>

            <Button onClick={handleCreate} disabled={creating} className="w-full gap-2">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {creating ? 'Criando...' : 'Publicar Enquete'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing polls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Enquetes Criadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPolls ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : polls.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma enquete criada ainda.</p>
            ) : (
              <div className="space-y-3">
                {polls.map(poll => (
                  <div key={poll.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    {poll.image_url && (
                      <img src={poll.image_url} alt="" className="h-12 w-12 rounded-md object-cover" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{poll.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={poll.poll_type === 'prediction' ? 'default' : 'secondary'} className="text-xs">
                          {poll.poll_type === 'prediction' ? '📈 Previsão' : '🗳️ Social'}
                        </Badge>
                        <Badge variant={poll.status === 'active' ? 'default' : 'outline'} className="text-xs">
                          {poll.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{poll.total_votes} votos</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right: AI Assistant */}
      <div className="space-y-4">
        <Card className="h-[calc(100vh-200px)] flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Assistente IA
            </CardTitle>
            <CardDescription>Ajuda com odds, payouts e textos</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            {/* Quick prompts */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {quickPrompts.map((qp, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => { setAiInput(qp.prompt); }}
                >
                  {qp.label}
                </Button>
              ))}
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 min-h-0">
              {aiMessages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <Bot className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Pergunte sobre odds, payouts, ou peça sugestões para sua enquete!</p>
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted border border-border'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2 border border-border">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                placeholder="Pergunte ao assistente..."
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendAiMessage()}
                disabled={aiLoading}
              />
              <Button size="icon" onClick={sendAiMessage} disabled={aiLoading || !aiInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
