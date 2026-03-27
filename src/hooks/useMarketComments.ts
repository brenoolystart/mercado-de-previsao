import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface MarketComment {
  id: string;
  market_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  liked_by_me: boolean;
  replies: MarketComment[];
}

export function useMarketComments(marketId: string) {
  const { user } = useAuthContext();
  const [comments, setComments] = useState<MarketComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data: raw } = await supabase
      .from('market_comments')
      .select('*')
      .eq('market_id', marketId)
      .order('created_at', { ascending: false });

    if (!raw || raw.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(raw.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    let likedIds = new Set<string>();
    if (user) {
      const { data: likes } = await supabase
        .from('market_comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', raw.map(c => c.id));
      likedIds = new Set(likes?.map(l => l.comment_id) || []);
    }

    const enriched: MarketComment[] = raw.map(c => ({
      ...c,
      author_name: profileMap.get(c.user_id)?.full_name || 'Usuário',
      author_avatar: profileMap.get(c.user_id)?.avatar_url || null,
      liked_by_me: likedIds.has(c.id),
      replies: [],
    }));

    // Build tree: top-level + replies
    const map = new Map(enriched.map(c => [c.id, c]));
    const topLevel: MarketComment[] = [];
    for (const c of enriched) {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies.push(c);
      } else {
        topLevel.push(c);
      }
    }
    // Sort replies ascending
    for (const c of topLevel) {
      c.replies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    setComments(topLevel);
    setLoading(false);
  }, [marketId, user]);

  const addComment = async (content: string, parentId?: string) => {
    if (!user) return;
    await supabase.from('market_comments').insert({
      market_id: marketId,
      user_id: user.id,
      content: content.trim(),
      parent_id: parentId || null,
    });
    await fetchComments();
  };

  const toggleLike = async (commentId: string) => {
    if (!user) return;
    const comment = findComment(comments, commentId);
    if (!comment) return;

    if (comment.liked_by_me) {
      await supabase.from('market_comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      await supabase.from('market_comments').update({ likes_count: Math.max(0, comment.likes_count - 1) }).eq('id', commentId);
    } else {
      await supabase.from('market_comment_likes').insert({ comment_id: commentId, user_id: user.id });
      await supabase.from('market_comments').update({ likes_count: comment.likes_count + 1 }).eq('id', commentId);
    }
    await fetchComments();
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;
    await supabase.from('market_comments').delete().eq('id', commentId).eq('user_id', user.id);
    await fetchComments();
  };

  return { comments, loading, fetchComments, addComment, toggleLike, deleteComment };
}

function findComment(comments: MarketComment[], id: string): MarketComment | undefined {
  for (const c of comments) {
    if (c.id === id) return c;
    const found = findComment(c.replies, id);
    if (found) return found;
  }
  return undefined;
}
