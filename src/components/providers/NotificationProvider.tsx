'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  markAsReadAction,
  markAllAsReadAction,
  deleteNotificationAction,
  clearAllNotificationsAction,
} from '@/lib/notifications/notification-actions';
import { sortNotifications, getUnreadCount } from '@/lib/notifications/notification-utils';
import { ENABLE_REALTIME_NOTIFICATIONS, NOTIFICATION_POLLING_INTERVAL } from '@/lib/notifications/constants';
import type { Notification, NotificationContextValue } from '@/types';

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  userId?: string | null;
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const supabase = useMemo(() => getBrowserSupabaseClient(), []);
  const channelRef = useRef<{ channel: RealtimeChannel; userId: string } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setNotifications(sortNotifications(data));
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userId]);

  // Subscribe to Realtime updates
  useEffect(() => {
    if (!ENABLE_REALTIME_NOTIFICATIONS) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current.channel);
        channelRef.current = null;
      }
      return;
    }

    if (!userId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current.channel);
        channelRef.current = null;
      }
      return;
    }

    if (
      channelRef.current &&
      channelRef.current.userId === userId &&
      channelRef.current.channel.state !== 'closed'
    ) {
      return;
    }

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current.channel);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setNotifications((prev) => sortNotifications([payload.new as Notification, ...prev]));
          } else if (payload.eventType === 'UPDATE') {
            setNotifications((prev) =>
              sortNotifications(
                prev.map((n) => (n.id === payload.new.id ? (payload.new as Notification) : n))
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    channelRef.current = { channel, userId };

    return () => {
      if (channelRef.current?.channel.state !== 'closed') {
        supabase.removeChannel(channelRef.current.channel);
      }
      channelRef.current = null;
    };
  }, [supabase, userId]);

  // Polling fallback
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    if (!ENABLE_REALTIME_NOTIFICATIONS) {
      const interval = setInterval(fetchNotifications, NOTIFICATION_POLLING_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await markAsReadAction(notificationId);
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      )
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadAction();
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })));
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await deleteNotificationAction(notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  }, []);

  const clearAll = useCallback(async () => {
    await clearAllNotificationsAction();
    setNotifications([]);
  }, []);

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = getUnreadCount(notifications);

  const value: NotificationContextValue = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
