import { Bell, Heart, MessageCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotifications } from '@/hooks/useNotifications';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (notif: typeof notifications[0]) => {
    if (!notif.is_read) markAsRead(notif.id);
    if (notif.reference_id?.startsWith('admin:')) {
      const tab = notif.reference_id.split(':')[1];
      navigate(`/admin?tab=${tab}`);
    } else if (notif.reference_id) {
      navigate('/feed');
    }
  };

  const getIcon = (type: string) => {
    if (type === 'post_like') return <Heart className="h-4 w-4 text-red-500 fill-red-500 shrink-0" />;
    if (type === 'market_resolved') return <Check className="h-4 w-4 text-green-500 shrink-0" />;
    if (type === 'referral') return <Heart className="h-4 w-4 text-primary shrink-0" />;
    if (type === 'bonus') return <Bell className="h-4 w-4 text-yellow-500 shrink-0" />;
    if (type?.startsWith('admin_')) return <Bell className="h-4 w-4 text-amber-500 shrink-0" />;
    return <MessageCircle className="h-4 w-4 text-primary shrink-0" />;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold text-sm">Notificações</h3>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Check className="h-3 w-3" /> Marcar todas
            </button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map(notif => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors border-b border-border/50 last:border-0 ${!notif.is_read ? 'bg-primary/5' : ''}`}
              >
                {getIcon(notif.type)}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!notif.is_read ? 'font-medium' : 'text-muted-foreground'}`}>{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: ptBR })}
                  </p>
                </div>
                {!notif.is_read && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
