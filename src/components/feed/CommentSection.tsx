import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import type { Comment } from '@/hooks/useFeed';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CommentSectionProps {
  postId: string;
  fetchComments: (postId: string) => Promise<Comment[]>;
  addComment: (postId: string, content: string) => Promise<any>;
}

export function CommentSection({ postId, fetchComments, addComment }: CommentSectionProps) {
  const { profile, user } = useAuthContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments(postId).then(c => { setComments(c); setLoading(false); });
  }, [postId, fetchComments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    const err = await addComment(postId, newComment);
    if (!err) {
      setNewComment('');
      const updated = await fetchComments(postId);
      setComments(updated);
    }
  };

  const getInitials = () => {
    if (profile?.full_name) return profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
      {loading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : (
        comments.map(c => (
          <div key={c.id} className="flex gap-2">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={c.author_avatar || undefined} />
              <AvatarFallback className="text-[10px] bg-muted">{c.author_name?.slice(0, 2).toUpperCase() || 'U'}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{c.author_name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <p className="text-xs text-foreground/80 break-words">{c.content}</p>
            </div>
          </div>
        ))
      )}

      <div className="flex gap-2 items-center">
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">{getInitials()}</AvatarFallback>
        </Avatar>
        <Input
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Responder..."
          className="h-7 text-xs bg-secondary"
          maxLength={300}
        />
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={handleSubmit} disabled={!newComment.trim()}>
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
