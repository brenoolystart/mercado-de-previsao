import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
  liked_by_me: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  author_avatar: string | null;
}

export function useFeed() {
  const { user } = useAuthContext();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data: postsData } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!postsData) { setLoading(false); return; }

    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    let likedPostIds: Set<string> = new Set();
    if (user) {
      const { data: likes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id);
      likedPostIds = new Set(likes?.map(l => l.post_id) || []);
    }

    const enriched: Post[] = postsData.map(p => {
      const profile = profileMap.get(p.user_id);
      return {
        ...p,
        author_name: profile?.full_name || 'Usuário',
        author_avatar: profile?.avatar_url || null,
        liked_by_me: likedPostIds.has(p.id),
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [user]);

  const createPost = async (content: string, imageUrl?: string) => {
    if (!user) return;
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      content: content.trim() || '',
      image_url: imageUrl || null,
    });
    if (!error) await fetchPosts();
    return error;
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.liked_by_me) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      await supabase.from('posts').update({ likes_count: Math.max(0, post.likes_count - 1) }).eq('id', postId);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      await supabase.from('posts').update({ likes_count: post.likes_count + 1 }).eq('id', postId);
    }

    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, liked_by_me: !p.liked_by_me, likes_count: p.liked_by_me ? p.likes_count - 1 : p.likes_count + 1 } : p
    ));
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const fetchComments = async (postId: string): Promise<Comment[]> => {
    const { data: comments } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!comments) return [];

    const userIds = [...new Set(comments.map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    return comments.map(c => ({
      ...c,
      author_name: profileMap.get(c.user_id)?.full_name || 'Usuário',
      author_avatar: profileMap.get(c.user_id)?.avatar_url || null,
    }));
  };

  const addComment = async (postId: string, content: string) => {
    if (!user) return;
    const { error } = await supabase.from('post_comments').insert({
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
    });
    if (!error) {
      const post = posts.find(p => p.id === postId);
      if (post) {
        await supabase.from('posts').update({ comments_count: post.comments_count + 1 }).eq('id', postId);
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
        ));
      }
    }
    return error;
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('posts-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return { posts, loading, createPost, toggleLike, deletePost, fetchComments, addComment, refreshPosts: fetchPosts };
}
