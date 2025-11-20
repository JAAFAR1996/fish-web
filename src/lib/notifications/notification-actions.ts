'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';

import { getUser } from '@/lib/auth/utils';
import type {
  Notification,
  NotificationData,
  NotificationPreferences,
  NotificationType,
} from '@/types';
import {
  clearAllNotifications,
  createNotification,
  deleteNotification,
  getUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notification-queries';
import { db } from '@server/db';
import { profiles } from '@shared/schema';

export async function markAsReadAction(notificationId: string): Promise<{ success: boolean }> {
  const user = await getUser();

  if (!user) {
    return { success: false };
  }

  const success = await markNotificationAsRead(notificationId, user.id);

  if (success) {
    revalidatePath('/[locale]/account');
  }

  return { success };
}

export async function markAllAsReadAction(): Promise<{ success: boolean }> {
  const user = await getUser();

  if (!user) {
    return { success: false };
  }

  const success = await markAllNotificationsAsRead(user.id);

  if (success) {
    revalidatePath('/[locale]/account');
  }

  return { success };
}

export async function deleteNotificationAction(
  notificationId: string,
): Promise<{ success: boolean }> {
  const user = await getUser();

  if (!user) {
    return { success: false };
  }

  const success = await deleteNotification(notificationId, user.id);

  if (success) {
    revalidatePath('/[locale]/account');
  }

  return { success };
}

export async function clearAllNotificationsAction(): Promise<{ success: boolean }> {
  const user = await getUser();

  if (!user) {
    return { success: false };
  }

  const success = await clearAllNotifications(user.id);

  if (success) {
    revalidatePath('/[locale]/account');
  }

  return { success };
}

export async function createNotificationAction(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: NotificationData,
  link?: string,
): Promise<{ success: boolean; notificationId?: string }> {
  const notification = await createNotification(userId, type, title, message, data, link);

  if (notification) {
    revalidatePath('/[locale]/account');
    return { success: true, notificationId: notification.id };
  }

  return { success: false };
}

export async function updateNotificationPreferencesAction(
  preferences: NotificationPreferences,
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  try {
    await db
      .update(profiles)
      .set({
        emailOrderUpdates: preferences.email_order_updates,
        emailShippingUpdates: preferences.email_shipping_updates,
        emailStockAlerts: preferences.email_stock_alerts,
        emailMarketing: preferences.email_marketing,
        inappNotificationsEnabled: preferences.inapp_notifications_enabled,
      })
      .where(eq(profiles.id, user.id));
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }

  revalidatePath('/[locale]/account');
  return { success: true };
}

export async function getUserNotificationsAction(): Promise<Notification[]> {
  const user = await getUser();

  if (!user) {
    return [];
  }

  return getUserNotifications(user.id);
}
