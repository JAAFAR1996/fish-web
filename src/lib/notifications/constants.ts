import type { NotificationType } from '@/types';

export const NOTIFICATION_TYPES: NotificationType[] = [
  'order_confirmation',
  'shipping_update',
  'stock_alert',
  'special_offer',
];

export const MAX_NOTIFICATIONS_DROPDOWN = 5;

export const MAX_NOTIFICATIONS_FETCH = 50;

export const NOTIFICATION_POLLING_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_NOTIFICATION_POLLING_INTERVAL || '300000',
  10
);

export const NOTIFICATION_RETENTION_DAYS = 30;

export const ENABLE_REALTIME_NOTIFICATIONS =
  process.env.NEXT_PUBLIC_ENABLE_REALTIME_NOTIFICATIONS !== 'false';
