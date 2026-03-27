import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { UserPlus, UserCheck } from 'lucide-react';

interface UserFollowCardProps {
  userId: string;
  name: string;
  avatar: string | null;
}

export function UserFollowCard({ userId, name, avatar }: UserFollowCardProps) {
  const { user } = useAuthContext();
  const { isFollowing, followersCount, toggleFollow } = useFollow(userId);
  const isMe = user?.id === userId;

  const initials = name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={avatar || undefined} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground">{followersCount} seguidores</p>
      </div>
      {!isMe && (
        <Button
          size="sm"
          variant={isFollowing ? 'secondary' : 'default'}
          onClick={toggleFollow}
          className="gap-1.5 rounded-full px-3 text-xs h-8"
        >
          {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
          {isFollowing ? 'Seguindo' : 'Seguir'}
        </Button>
      )}
    </div>
  );
}
