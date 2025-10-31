import type { Notification, NotificationType, Locale } from '@/types';

export function formatNotificationTime(dateString: string, locale: Locale): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return locale === 'ar' ? 'الآن' : 'just now';
  } else if (diffMins < 60) {
    return locale === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return locale === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return locale === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString(locale === 'ar' ? 'ar-IQ' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  }
}

export function getNotificationIcon(type: NotificationType): string {
  const iconMap: Record<NotificationType, string> = {
    order_confirmation: 'check-circle',
    shipping_update: 'truck',
    stock_alert: 'bell-ring',
    special_offer: 'tag',
  };
  return iconMap[type] || 'bell';
}

export function getNotificationColor(type: NotificationType): string {
  const colorMap: Record<NotificationType, string> = {
    order_confirmation: 'text-green-500',
    shipping_update: 'text-blue-500',
    stock_alert: 'text-orange-500',
    special_offer: 'text-purple-500',
  };
  return colorMap[type] || 'text-gray-500';
}

export function sortNotifications(notifications: Notification[]): Notification[] {
  return [...notifications].sort((a, b) => {
    // Unread first
    if (!a.read_at && b.read_at) return -1;
    if (a.read_at && !b.read_at) return 1;
    // Then by created date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export function filterUnreadNotifications(notifications: Notification[]): Notification[] {
  return notifications.filter((n) => !n.read_at);
}

export function getUnreadCount(notifications: Notification[]): number {
  return filterUnreadNotifications(notifications).length;
}
