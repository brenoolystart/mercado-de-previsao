import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  reference_id: string | null;
  actor_id: string | null;
  is_read: boolean;
  created_at: string;
}

const requestPushPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
};

const showBrowserNotification = (title: string, body: string, tag?: string) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const options: NotificationOptions & Record<string, unknown> = {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: tag || `notif-${Date.now()}`,
      requireInteraction: false,
    };
    const notif = new window.Notification(title, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (e) {
    // SW fallback for mobile
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: tag || `notif-${Date.now()}`,
        });
      });
    }
  }
};

export function useNotifications() {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushEnabled, setPushEnabled] = useState(false);
  const permissionRequested = useRef(false);

  // Request push permission for admin notifications
  const enablePush = useCallback(async () => {
    const granted = await requestPushPermission();
    setPushEnabled(granted);
    return granted;
  }, []);

  // Auto-request push permission for all authenticated users
  useEffect(() => {
    if (!user || permissionRequested.current) return;
    permissionRequested.current = true;
    requestPushPermission().then(granted => setPushEnabled(granted));
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime + browser push
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notifications-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotif = payload.new as Notification;
        setNotifications(prev => [newNotif, ...prev].slice(0, 30));
        setUnreadCount(prev => prev + 1);

        // Fire browser push for all notification types
        showBrowserNotification(newNotif.title, newNotif.message, newNotif.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  return { notifications, unreadCount, markAsRead, markAllAsRead, refetch: fetchNotifications, pushEnabled, enablePush };
}
