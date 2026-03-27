import { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, X, Send, Loader2, Sparkles, Plus, MessageSquare, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsAdmin } from '@/hooks/useIsAdmin';
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
  { label: '📈 Crescimento', prompt: 'Quais estratégias posso usar para crescer a base de usuários da OnChoice?' },
  { label: '🔧 Otimizações', prompt: 'Quais otimizações de performance e UX poderiam melhorar a OnChoice?' },
];

const STREAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grok3-assistant`;

export function Grok3ChatBot() {
  const { isAdmin, loading } = useIsAdmin();
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      .limit(20);
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
      setShowHistory(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && user) fetchConversations();
  }, [isOpen, user, fetchConversations]);

  if (loading || !isAdmin) return null;

  const startNewConversation = () => {
    setMessages([]);
    setActiveConversationId(null);
    setShowHistory(false);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
      // Create conversation if new
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

      // Save user message
      if (convId) {
        await supabase.from('grok3_messages').insert({
          conversation_id: convId,
          role: 'user',
          content: text.trim(),
        });
      }

      // Stream the response - filter out error messages from context
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

      // Parse SSE stream token by token
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      // Add empty assistant message
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

      // Final flush
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

      // Save assistant message
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
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[60] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
          title="OnChoice AI - Assistente"
        >
          <Bot className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-[60] md:w-[420px] md:max-w-[calc(100vw-2rem)] md:h-[560px] md:max-h-[calc(100vh-8rem)] bg-card md:border md:border-border md:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">OnChoice AI</h3>
                <p className="text-[10px] text-muted-foreground">Assistente Inteligente</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setShowHistory(!showHistory)} className="h-8 w-8" title="Histórico">
                <MessageSquare className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={startNewConversation} className="h-8 w-8" title="Nova conversa">
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* History sidebar */}
          {showHistory ? (
            <ScrollArea className="flex-1 px-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Conversas anteriores</p>
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">Nenhuma conversa salva.</p>
              ) : (
                <div className="space-y-1">
                  {conversations.map(c => (
                    <div
                      key={c.id}
                      onClick={() => loadConversation(c.id)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors ${
                        c.id === activeConversationId ? 'bg-primary/10 text-primary' : 'hover:bg-secondary text-foreground'
                      }`}
                    >
                      <span className="truncate flex-1">{c.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0 opacity-50 hover:opacity-100"
                        onClick={(e) => deleteConversation(c.id, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          ) : (
            <>
              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3 overflow-y-auto" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="space-y-3">
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm font-medium text-foreground mb-1">
                        Olá! Sou o <strong>OnChoice AI</strong> 👋
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Seu assistente estratégico. Como posso ajudar?
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {QUICK_ACTIONS.map((action) => (
                        <button
                          key={action.label}
                          onClick={() => sendMessage(action.prompt)}
                          className="text-left text-xs px-3 py-2 rounded-lg bg-secondary hover:bg-accent transition-colors text-foreground"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full`}>
                        <div className={`rounded-xl px-3 py-2 text-[13px] leading-relaxed break-words ${
                          msg.role === 'user' ? 'max-w-[80%] bg-primary text-primary-foreground' : 'max-w-full bg-secondary text-foreground'
                        }`}>
                          {msg.role === 'assistant' ? (
                            <div className="prose prose-xs dark:prose-invert max-w-none break-words overflow-hidden
                              [&_p]:m-0 [&_p]:mb-1.5 [&_p]:text-[13px] [&_p]:leading-relaxed
                              [&_ul]:my-1 [&_ul]:pl-4 [&_ol]:my-1 [&_ol]:pl-4
                              [&_li]:my-0 [&_li]:text-[13px]
                              [&_h1]:text-sm [&_h1]:font-bold [&_h1]:mb-1 [&_h1]:mt-2
                              [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:mb-1 [&_h2]:mt-2
                              [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:mb-1 [&_h3]:mt-1.5
                              [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_pre]:text-[11px] [&_pre]:p-2 [&_pre]:rounded-md [&_pre]:my-1.5
                              [&_code]:text-[11px] [&_code]:break-all [&_code]:whitespace-pre-wrap
                              [&_blockquote]:border-l-2 [&_blockquote]:border-primary/30 [&_blockquote]:pl-2 [&_blockquote]:my-1 [&_blockquote]:text-[12px]
                              [&_table]:text-[11px] [&_table]:my-1
                              [&_strong]:font-semibold
                            ">
                              {msg.content ? (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                  <span className="text-xs text-muted-foreground">Pensando...</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-[13px]">{msg.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
                      <div className="flex justify-start">
                        <div className="bg-secondary rounded-xl px-3 py-2 flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin text-primary" />
                          <span className="text-xs text-muted-foreground">Pensando...</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-border p-3">
                <div className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Pergunte ao OnChoice AI..."
                    className="min-h-[40px] max-h-[80px] resize-none text-sm"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    onClick={() => sendMessage(input)}
                    disabled={!input.trim() || isLoading}
                    className="shrink-0 h-10 w-10"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}