import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, Trash2, MoreHorizontal, UserPlus, UserCheck } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { InvestmentBadge } from '@/components/InvestmentBadge';
import { CommentSection } from './CommentSection';
import { supabase } from '@/integrations/supabase/client';
import type { Post, Comment } from '@/hooks/useFeed';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  fetchComments: (postId: string) => Promise<Comment[]>;
  addComment: (postId: string, content: string) => Promise<any>;
}

export function PostCard({ post, onLike, onDelete, fetchComments, addComment }: PostCardProps) {
  const { user } = useAuthContext();
  const [showComments, setShowComments] = useState(false);
  const [totalVolume, setTotalVolume] = useState(0);
  const { isFollowing, toggleFollow } = useFollow(post.user_id);
  const isOwner = user?.id === post.user_id;

  useEffect(() => {
    const fetchVolume = async () => {
      const { data } = await supabase
        .from('bets')
        .select('amount')
        .eq('user_id', post.user_id);
      if (data) {
        setTotalVolume(data.reduce((sum, b) => sum + Number(b.amount), 0));
      }
    };
    fetchVolume();
  }, [post.user_id]);

  const getInitials = () => {
    if (post.author_name) return post.author_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return 'U';
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR });

  return (
    <div className="border border-border rounded-xl p-4 bg-card hover:bg-card/80 transition-colors">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={post.author_avatar || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm">{getInitials()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-sm text-foreground truncate">{post.author_name}</span>
              <InvestmentBadge totalVolume={totalVolume} size="sm" />
              <span className="text-xs text-muted-foreground shrink-0">· {timeAgo}</span>
              {!isOwner && (
                <button
                  onClick={toggleFollow}
                  className={`ml-1 text-xs font-medium transition-colors ${isFollowing ? 'text-muted-foreground' : 'text-primary hover:text-primary/80'}`}
                >
                  {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {post.content && <p className="text-sm text-foreground mt-1 whitespace-pre-wrap break-words">{post.content}</p>}

          {post.image_url && (
            <div className="mt-2 rounded-lg overflow-hidden border border-border">
              <img src={post.image_url} alt="Post" className="w-full max-h-96 object-cover" loading="lazy" />
            </div>
          )}

          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 text-xs transition-colors ${post.liked_by_me ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
            >
              <Heart className={`h-4 w-4 ${post.liked_by_me ? 'fill-current' : ''}`} />
              {post.likes_count > 0 && post.likes_count}
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              {post.comments_count > 0 && post.comments_count}
            </button>
          </div>

          {showComments && (
            <CommentSection
              postId={post.id}
              fetchComments={fetchComments}
              addComment={addComment}
            />
          )}
        </div>
      </div>
    </div>
  );
}
