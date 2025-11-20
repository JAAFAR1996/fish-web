'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import {
  clearAllNotificationsAction,
  deleteNotificationAction,
  getUserNotificationsAction,
  markAllAsReadAction,
  markAsReadAction,
} from '@/lib/notifications/notification-actions';
import { NOTIFICATION_POLLING_INTERVAL } from '@/lib/notifications/constants';
import { getUnreadCount, sortNotifications } from '@/lib/notifications/notification-utils';
import type { Notification, NotificationContextValue } from '@/types';

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  userId?: string | null;
}

export function NotificationProvider({ children, userId }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await getUserNotificationsAction();
      setNotifications(sortNotifications(data));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetchNotifications();
  }, [userId, fetchNotifications]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const interval = setInterval(fetchNotifications, NOTIFICATION_POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [userId, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    await markAsReadAction(notificationId);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read_at: new Date().toISOString() }
          : notification,
      ),
    );
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllAsReadAction();
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? now,
      })),
    );
  }, []);

  const deleteNotification = useCallback(async (notificationId: string) => {
    await deleteNotificationAction(notificationId);
    setNotifications((prev) => prev.filter((notification) => notification.id !== notificationId));
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
