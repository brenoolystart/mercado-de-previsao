import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileHotbar } from '@/components/MobileHotbar';
import { CreatePost } from '@/components/feed/CreatePost';
import { PostCard } from '@/components/feed/PostCard';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useFeed } from '@/hooks/useFeed';
import { useAuthContext } from '@/contexts/AuthContext';
import { Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Feed() {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { posts, loading, createPost, toggleLike, deletePost, fetchComments, addComment } = useFeed();
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />

      <main className="container max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Comunidade</h1>
        </div>

        {isAuthenticated ? (
          <>
            <div className="mb-6">
              <CreatePost onSubmit={createPost} />
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum post ainda. Seja o primeiro!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={toggleLike}
                    onDelete={deletePost}
                    fetchComments={fetchComments}
                    addComment={addComment}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <MessageSquare className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-2">Entre para participar</h2>
            <p className="text-muted-foreground text-sm mb-4">Faça login para ver e criar posts na comunidade.</p>
            <Button onClick={() => navigate('/login')}>Entrar</Button>
          </div>
        )}
      </main>

      <Footer />
      <MobileHotbar activeItem="feed" />
    </div>
  );
}
