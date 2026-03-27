import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileHotbar } from '@/components/MobileHotbar';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAuthContext } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useFollow } from '@/hooks/useFollow';
import { useWallet } from '@/hooks/useWallet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/feed/PostCard';
import { InvestmentBadge } from '@/components/InvestmentBadge';
import { useFeed } from '@/hooks/useFeed';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getInvestmentLevel, getNextLevel } from '@/lib/investmentLevels';
import {
  Loader2, Calendar, TrendingUp, TrendingDown,
  UserPlus, UserCheck, BarChart3, Target, Trophy, Wallet,
  ArrowUpRight, ArrowDownRight, Clock, Camera
} from 'lucide-react';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Profile() {
  const { isDark, toggleDarkMode } = useDarkMode();
  const { user, isAuthenticated, updateProfile } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { profileData, posts, bets, stats, loading, isOwnProfile } = useProfile();
  const { isFollowing, followersCount, followingCount, toggleFollow } = useFollow(user?.id);
  const { wallet } = useWallet();
  const { toggleLike, deletePost, fetchComments, addComment } = useFeed();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Erro', description: 'Selecione uma imagem válida.', variant: 'destructive' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Erro', description: 'A imagem deve ter no máximo 2MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const avatarUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateProfile) {
        await updateProfile({ avatar_url: avatarUrl });
      }

      toast({ title: 'Foto atualizada!', description: 'Sua foto de perfil foi alterada.' });
      window.location.reload();
    } catch (err: any) {
      toast({ title: 'Erro ao enviar foto', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
        <div className="flex flex-col items-center justify-center py-24">
          <p className="text-muted-foreground mb-4">Faça login para ver seu perfil.</p>
          <Button onClick={() => navigate('/login')}>Entrar</Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />
        <div className="flex justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const initials = profileData?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const memberSince = profileData?.created_at
    ? format(new Date(profileData.created_at), "MMMM 'de' yyyy", { locale: ptBR })
    : '';

  const activeBets = bets.filter(b => b.status === 'pending');
  const resolvedBets = bets.filter(b => b.status === 'won' || b.status === 'lost');

  const currentLevel = getInvestmentLevel(stats.totalVolume);
  const nextLevelInfo = getNextLevel(stats.totalVolume);
  const LevelIcon = currentLevel.icon;
  const progressPercent = nextLevelInfo
    ? ((stats.totalVolume - currentLevel.minAmount) / (nextLevelInfo.level.minAmount - currentLevel.minAmount)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-background">
      <Header isDark={isDark} toggleDarkMode={toggleDarkMode} />

      <main className="container max-w-3xl mx-auto px-4 py-6 pb-24">
        {/* Profile Header */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 ring-4" style={{ '--tw-ring-color': currentLevel.color } as any}>
                <AvatarImage src={profileData?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg hover:opacity-90 transition-opacity"
                  >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">{profileData?.full_name || 'Usuário'}</h1>
                    <InvestmentBadge totalVolume={stats.totalVolume} size="md" showLabel />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Membro desde {memberSince}</span>
                  </div>
                </div>
                {!isOwnProfile && (
                  <Button
                    variant={isFollowing ? 'secondary' : 'default'}
                    size="sm"
                    onClick={toggleFollow}
                    className="gap-1.5 rounded-full"
                  >
                    {isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {isFollowing ? 'Seguindo' : 'Seguir'}
                  </Button>
                )}
              </div>

              {/* Follow stats */}
              <div className="flex items-center gap-4 mt-3">
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{followersCount}</span>
                  <span className="text-muted-foreground ml-1">seguidores</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold text-foreground">{followingCount}</span>
                  <span className="text-muted-foreground ml-1">seguindo</span>
                </div>
              </div>

              {/* Level progress */}
              {isOwnProfile && nextLevelInfo && (
                <div className="mt-3 p-2.5 rounded-lg border border-border bg-secondary/30">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <LevelIcon className="h-3 w-3" style={{ color: currentLevel.color }} />
                      {currentLevel.name}
                    </span>
                    <span className="text-muted-foreground">
                      Faltam R$ {nextLevelInfo.remaining.toLocaleString('pt-BR')} para {nextLevelInfo.level.name}
                    </span>
                  </div>
                  <ProgressBar value={progressPercent} className="h-1.5" />
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          {isOwnProfile && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <StatCard icon={Wallet} label="Saldo" value={`R$ ${wallet?.balance?.toFixed(2) || '0.00'}`} />
              <StatCard icon={BarChart3} label="Total Palpites" value={stats.totalBets.toString()} />
              <StatCard icon={Target} label="Ativas" value={stats.activeBets.toString()} accent />
              <StatCard icon={Trophy} label="Taxa de Acerto" value={`${stats.winRate}%`} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="w-full bg-card border border-border rounded-xl h-11 p-1">
            {isOwnProfile && (
              <TabsTrigger value="positions" className="flex-1 rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Posições
              </TabsTrigger>
            )}
            <TabsTrigger value="posts" className="flex-1 rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Posts
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="history" className="flex-1 rounded-lg text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Histórico
              </TabsTrigger>
            )}
          </TabsList>

          {isOwnProfile && (
            <TabsContent value="positions" className="mt-4 space-y-3">
              {activeBets.length === 0 ? (
                <EmptyState icon={Target} text="Nenhuma posição ativa" />
              ) : (
                activeBets.map(bet => <BetCard key={bet.id} bet={bet} />)
              )}
            </TabsContent>
          )}

          <TabsContent value="posts" className="mt-4 space-y-4">
            {posts.length === 0 ? (
              <EmptyState icon={BarChart3} text="Nenhum post ainda" />
            ) : (
              posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={toggleLike}
                  onDelete={deletePost}
                  fetchComments={fetchComments}
                  addComment={addComment}
                />
              ))
            )}
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="history" className="mt-4 space-y-3">
              {resolvedBets.length === 0 ? (
                <EmptyState icon={Clock} text="Nenhum contrato resolvido" />
              ) : (
                resolvedBets.map(bet => <BetCard key={bet.id} bet={bet} />)
              )}
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Footer />
      <MobileHotbar activeItem="profile" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${accent ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/50'}`}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-3.5 w-3.5 ${accent ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-lg font-bold ${accent ? 'text-primary' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}

function BetCard({ bet }: { bet: any }) {
  const isWon = bet.status === 'won';
  const isLost = bet.status === 'lost';
  const isPending = bet.status === 'pending';

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{bet.market_title}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              bet.position === 'yes'
                ? 'bg-[hsl(var(--green)/0.15)] text-[hsl(var(--green))]'
                : 'bg-[hsl(var(--red)/0.15)] text-[hsl(var(--red))]'
            }`}>
              {bet.position === 'yes' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {bet.position === 'yes' ? 'Sim' : 'Não'}
            </span>
            <span className="text-xs text-muted-foreground">
              {(bet.price_at_bet * 100).toFixed(0)}¢
            </span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold text-foreground">R$ {bet.amount.toFixed(2)}</p>
          {isPending && (
            <div className="flex items-center gap-1 text-xs text-primary mt-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>R$ {bet.potential_payout.toFixed(2)}</span>
            </div>
          )}
          {isWon && (
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--green))] mt-1">
              <ArrowUpRight className="h-3 w-3" />
              <span>+R$ {(bet.payout_amount || 0).toFixed(2)}</span>
            </div>
          )}
          {isLost && (
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--red))] mt-1">
              <ArrowDownRight className="h-3 w-3" />
              <span>-R$ {bet.amount.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(bet.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isPending ? 'bg-primary/10 text-primary' :
          isWon ? 'bg-[hsl(var(--green)/0.15)] text-[hsl(var(--green))]' :
          'bg-[hsl(var(--red)/0.15)] text-[hsl(var(--red))]'
        }`}>
          {isPending ? 'Ativo' : isWon ? 'Ganhou' : 'Perdeu'}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
  return (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
