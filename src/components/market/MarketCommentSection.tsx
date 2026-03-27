import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Heart, MessageCircle, Send, MoreHorizontal, Trash2 } from 'lucide-react';
import { useMarketComments, type MarketComment } from '@/hooks/useMarketComments';
import { useAuthContext } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from 'react-router-dom';

// Bot comments shown when no real comments exist
const BOT_POOL = [
  { name: 'TraderBR', comment: 'Esse mercado pode surpreender, vale ficar de olho nos próximos dias.' },
  { name: 'CryptoMaster', comment: 'Apostei forte aqui, acredito no resultado positivo.' },
  { name: 'AnalystPro', comment: 'Os dados recentes indicam uma mudança de tendência interessante.' },
  { name: 'InvestidorX', comment: 'Acompanhando de perto, muita volatilidade nesse mercado.' },
  { name: 'MariaTrader', comment: 'Fiz minha aposta, agora é esperar o resultado!' },
  { name: 'PredictorBR', comment: 'As odds estão se movendo rápido, boa oportunidade.' },
];

function getBotComments(marketId: string): MarketComment[] {
  const seed = marketId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const count = 2 + (seed % 3); // 2-4 bot comments
  const comments: MarketComment[] = [];
  for (let i = 0; i < count && i < BOT_POOL.length; i++) {
    const bot = BOT_POOL[(seed + i) % BOT_POOL.length];
    const hoursAgo = 1 + ((seed + i * 7) % 48);
    const date = new Date(Date.now() - hoursAgo * 3600000);
    comments.push({
      id: `bot-${i}`,
      market_id: marketId,
      user_id: `bot-${i}`,
      content: bot.comment,
      parent_id: null,
      likes_count: (seed + i * 3) % 12,
      created_at: date.toISOString(),
      author_name: bot.name,
      author_avatar: null,
      liked_by_me: false,
      replies: [],
    });
  }
  return comments;
}

interface MarketCommentSectionProps {
  marketId: string;
  holderUserIds?: Set<string>;
}

export function MarketCommentSection({ marketId, holderUserIds }: MarketCommentSectionProps) {
  const { user } = useAuthContext();
  const { comments, loading, fetchComments, addComment, toggleLike, deleteComment } = useMarketComments(marketId);
  const botComments = useMemo(() => getBotComments(marketId), [marketId]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    await addComment(newComment);
    setNewComment('');
    setSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* New comment input */}
      {user ? (
        <div className="bg-card border border-border rounded-lg p-4">
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="O que você acha sobre esse mercado?"
            className="min-h-[80px] bg-secondary/50 border-0 resize-none mb-3"
            maxLength={500}
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim() || submitting}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Enviando...' : 'Comentar'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Entre</Link> para participar da discussão
          </p>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Carregando comentários...</p>
        </div>
      ) : (
        <div className="space-y-1">
          {/* Show real comments, or bot comments as fallback */}
          {(comments.length > 0 ? comments : botComments).map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onLike={toggleLike}
              onReply={addComment}
              onDelete={deleteComment}
              currentUserId={user?.id}
              isHolder={holderUserIds?.has(comment.user_id) || false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentItem({
  comment,
  onLike,
  onReply,
  onDelete,
  currentUserId,
  isReply = false,
  isHolder = false,
}: {
  comment: MarketComment;
  onLike: (id: string) => void;
  onReply: (content: string, parentId: string) => Promise<void>;
  onDelete: (id: string) => void;
  currentUserId?: string;
  isReply?: boolean;
  isHolder?: boolean;
}) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyText.trim() || submitting) return;
    setSubmitting(true);
    await onReply(replyText, comment.id);
    setReplyText('');
    setShowReplyInput(false);
    setSubmitting(false);
  };

  const initials = comment.author_name
    ? comment.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className={`${isReply ? 'ml-10 border-l-2 border-border/50 pl-4' : ''}`}>
      <div className="bg-card border border-border/50 rounded-lg p-4 hover:bg-accent/5 transition-colors">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={comment.author_avatar || undefined} />
            <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">{comment.author_name}</span>
                {isHolder && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'hsla(199, 89%, 48%, 0.15)', color: 'hsl(199, 89%, 60%)' }}>
                    HOLDER
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {currentUserId === comment.user_id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="text-sm text-foreground/90 mt-1 break-words">{comment.content}</p>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => onLike(comment.id)}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  comment.liked_by_me ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${comment.liked_by_me ? 'fill-current' : ''}`} />
                {comment.likes_count > 0 && comment.likes_count}
              </button>
              {!isReply && currentUserId && (
                <button
                  onClick={() => setShowReplyInput(!showReplyInput)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Responder
                </button>
              )}
              {comment.replies.length > 0 && (
                <button
                  onClick={() => setShowReplies(!showReplies)}
                  className="text-xs text-primary hover:underline"
                >
                  {showReplies ? 'Ocultar' : `${comment.replies.length} Resposta${comment.replies.length > 1 ? 's' : ''}`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reply input */}
      {showReplyInput && (
        <div className="ml-10 mt-1 flex gap-2 items-start">
          <Textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            placeholder={`Responder a ${comment.author_name}...`}
            className="min-h-[60px] text-sm bg-secondary/50 border-border/50 resize-none"
            maxLength={500}
          />
          <div className="flex flex-col gap-1">
            <Button size="icon" className="h-8 w-8" onClick={handleReply} disabled={!replyText.trim() || submitting}>
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Replies */}
      {showReplies && comment.replies.length > 0 && (
        <div className="mt-1 space-y-1">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              onDelete={onDelete}
              currentUserId={currentUserId}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
