'use server';

import { revalidatePath } from 'next/cache';
import { getUser } from '@/lib/auth/utils';
import type { NotificationData, NotificationType, NotificationPreferences } from '@/types';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification,
} from './notification-queries';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
  notificationId: string
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
  link?: string
): Promise<{ success: boolean; notificationId?: string }> {
  const notification = await createNotification(userId, type, title, message, data, link);

  if (notification) {
    revalidatePath('/[locale]/account');
    return { success: true, notificationId: notification.id };
  }

  return { success: false };
}

export async function updateNotificationPreferencesAction(
  preferences: NotificationPreferences
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();

  if (!user) {
    return { success: false, error: 'User not authenticated' };
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      email_order_updates: preferences.email_order_updates,
      email_shipping_updates: preferences.email_shipping_updates,
      email_stock_alerts: preferences.email_stock_alerts,
      email_marketing: preferences.email_marketing,
      inapp_notifications_enabled: preferences.inapp_notifications_enabled,
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/[locale]/account');
  return { success: true };
}
