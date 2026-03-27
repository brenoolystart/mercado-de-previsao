import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Loader2, Sparkles, Plus, MessageSquare, Trash2, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const QUICK_ACTIONS = [
  { label: '📊 Status da plataforma', prompt: 'Faça uma análise rápida do status da plataforma OnChoice e sugira os próximos passos estratégicos.' },
  { label: '💡 Novas funcionalidades', prompt: 'Quais funcionalidades inovadoras poderiam ser adicionadas à OnChoice para aumentar o engajamento dos usuários?' },
  { label: '📈 Estratégias de crescimento', prompt: 'Quais estratégias posso usar para crescer a base de usuários da OnChoice?' },
  { label: '🔧 Otimizações técnicas', prompt: 'Quais otimizações de performance e UX poderiam melhorar a OnChoice?' },
  { label: '💰 Monetização', prompt: 'Quais são as melhores estratégias de monetização para uma plataforma de mercados de previsão como a OnChoice?' },
  { label: '🛡️ Segurança e compliance', prompt: 'Quais medidas de segurança e compliance a OnChoice deveria implementar?' },
];

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grok3-assistant`;

export function AdminAI() {
  const { user } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('grok3_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, [user]);

  const loadConversation = useCallback(async (convId: string) => {
    const { data } = await supabase
      .from('grok3_messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data as Message[]);
      setActiveConversationId(convId);
    }
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  const startNewConversation = () => {
    setMessages([]);
    setActiveConversationId(null);
    textareaRef.current?.focus();
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('grok3_messages').delete().eq('conversation_id', convId);
    await supabase.from('grok3_conversations').delete().eq('id', convId);
    if (activeConversationId === convId) startNewConversation();
    fetchConversations();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !user) return;

    const userMsg: Message = { role: 'user', content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput('');
    setIsLoading(true);

    let convId = activeConversationId;

    try {
      if (!convId) {
        const title = text.trim().slice(0, 60) || 'Nova conversa';
        const { data: conv } = await supabase
          .from('grok3_conversations')
          .insert({ user_id: user.id, title })
          .select('id')
          .single();
        if (conv) {
          convId = conv.id;
          setActiveConversationId(conv.id);
        }
      } else {
        await supabase
          .from('grok3_conversations')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', convId);
      }

      if (convId) {
        await supabase.from('grok3_messages').insert({
          conversation_id: convId,
          role: 'user',
          content: text.trim(),
        });
      }

      const cleanMessages = allMessages.filter(m => !(m.role === 'assistant' && m.content.startsWith('❌')));
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('Sessão expirada. Faça login novamente.');

      const resp = await fetch(STREAM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ messages: cleanMessages }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro ${resp.status}`);
      }

      if (!resp.body) throw new Error('Sem resposta do servidor');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              const finalContent = assistantContent;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: finalContent };
                return updated;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              const finalContent = assistantContent;
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: finalContent };
                return updated;
              });
            }
          } catch { /* ignore */ }
        }
      }

      if (convId && assistantContent) {
        await supabase.from('grok3_messages').insert({
          conversation_id: convId,
          role: 'assistant',
          content: assistantContent,
        });
      }

      fetchConversations();
    } catch (e: any) {
      const errMsg = `❌ ${e.message || 'Falha na comunicação'}`;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant' && last.content === '') {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: errMsg };
          return updated;
        }
        return [...prev, { role: 'assistant', content: errMsg }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] rounded-xl border border-border overflow-hidden bg-background">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 border-r border-border bg-card flex flex-col overflow-hidden`}>
        <div className="p-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground truncate">Conversas</span>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={startNewConversation} title="Nova conversa">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-0.5">
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8 px-2">Nenhuma conversa ainda.</p>
            ) : (
              conversations.map(c => (
                <div
                  key={c.id}
                  onClick={() => loadConversation(c.id)}
                  className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer text-sm transition-colors ${
                    c.id === activeConversationId
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-muted text-foreground'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
                  <span className="truncate flex-1">{c.title}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => deleteConversation(c.id, e)}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 border-b border-border flex items-center px-4 gap-3 bg-card/50">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground leading-tight">OnChoice AI</h3>
              <p className="text-[10px] text-muted-foreground leading-tight">Assistente Estratégico</p>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <ScrollArea className="flex-1 overflow-y-auto" ref={scrollRef}>
          <div className="max-w-3xl mx-auto w-full px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Como posso ajudar?</h2>
                <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                  Sou o assistente estratégico da OnChoice. Pergunte sobre mercados, crescimento, otimizações ou qualquer dúvida operacional.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => sendMessage(action.prompt)}
                      className="text-left text-sm px-4 py-3 rounded-xl border border-border hover:bg-muted hover:border-primary/30 transition-all text-foreground"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'max-w-[70%] bg-primary text-primary-foreground'
                        : 'max-w-[85%] bg-muted/60'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none
                          [&_p]:my-1.5 [&_p]:leading-relaxed
                          [&_ul]:my-2 [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:pl-5
                          [&_li]:my-0.5
                          [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-3
                          [&_h2]:text-base [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-3
                          [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1.5 [&_h3]:mt-2
                          [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:text-xs [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:my-2
                          [&_code]:text-xs
                          [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-3 [&_blockquote]:my-2 [&_blockquote]:text-sm
                          [&_table]:text-xs [&_table]:my-2
                          [&_strong]:font-semibold
                        ">
                          {msg.content ? (
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Pensando...</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0 mt-1">
                        <span className="text-xs font-bold text-foreground">Eu</span>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="bg-muted/60 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Pensando...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border p-4 bg-card/50">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-3 items-end">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Envie uma mensagem ao OnChoice AI..."
                className="min-h-[44px] max-h-[160px] resize-none text-sm rounded-xl"
                rows={1}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="shrink-0 h-11 w-11 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              OnChoice AI pode cometer erros. Verifique informações importantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
