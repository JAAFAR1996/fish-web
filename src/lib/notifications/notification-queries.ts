import { db } from '@server/db';
import { notifications } from '@shared/schema';
import {
  and,
  desc,
  eq,
  isNull,
  sql,
} from 'drizzle-orm';

import type {
  Notification,
  NotificationData,
  NotificationType,
} from '@/types';

import { MAX_NOTIFICATIONS_FETCH } from './constants';

type NotificationRow = typeof notifications.$inferSelect;

const toIsoString = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : value ?? new Date(0).toISOString();

function transformNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    user_id: row.userId,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    data: (row.data as NotificationData | null) ?? null,
    link: row.link ?? null,
    read_at: row.readAt ? toIsoString(row.readAt) : null,
    created_at: toIsoString(row.createdAt),
  };
}

export async function getUserNotifications(
  userId: string,
  limit: number = MAX_NOTIFICATIONS_FETCH,
): Promise<Notification[]> {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return rows.map(transformNotification);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function getUnreadNotifications(userId: string): Promise<Notification[]> {
  try {
    const rows = await db
      .select()
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      )
      .orderBy(desc(notifications.createdAt));

    return rows.map(transformNotification);
  } catch (error) {
    console.error('Error fetching unread notifications:', error);
    return [];
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(notifications)
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      );

    return result?.count ?? 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  try {
    const result = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      )
      .returning({ id: notifications.id });

    return result.length > 0;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const result = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(eq(notifications.userId, userId), isNull(notifications.readAt)),
      )
      .returning({ id: notifications.id });

    return result.length > 0;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  try {
    const result = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
        ),
      )
      .returning({ id: notifications.id });

    return result.length > 0;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}

export async function clearAllNotifications(userId: string): Promise<boolean> {
  try {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.userId, userId))
      .returning({ id: notifications.id });

    return result.length > 0;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
  link?: string,
): Promise<Notification | null> {
  try {
    const [row] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        message,
        data: data ?? null,
        link: link ?? null,
      })
      .returning();

    return row ? transformNotification(row) : null;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}
