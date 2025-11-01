'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Icon, Button, type IconName } from '@/components/ui';
import { formatNotificationTime, getNotificationIcon, getNotificationColor } from '@/lib/notifications/notification-utils';
import { cn } from '@/lib/utils';
import type { Notification, Locale } from '@/types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const t = useTranslations('notifications');
  const locale = useLocale() as Locale;
  const isUnread = !notification.read_at;
  const iconName = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);
  const timeAgo = formatNotificationTime(notification.created_at, locale);

  const handleClick = async () => {
    if (isUnread) {
      await onMarkAsRead(notification.id);
    }
  };

  const ItemContent = (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg transition-colors hover:bg-muted/50',
        isUnread && 'bg-aqua-500/5'
      )}
    >
      <div className="flex-shrink-0">
        <div className={cn('rounded-full p-2 bg-muted', iconColor)}>
          <Icon name={iconName} size="sm" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className={cn('text-sm font-medium', isUnread && 'font-semibold')}>
            {notification.title}
          </h4>
          {isUnread && (
            <span className="flex-shrink-0 h-2 w-2 rounded-full bg-aqua-500" />
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {notification.message}
        </p>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <div className="flex items-center gap-1">
            {isUnread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                className="h-7 px-2 text-xs"
              >
                {t('markAsRead')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            >
              {t('delete')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} onClick={handleClick} className="block">
        {ItemContent}
      </Link>
    );
  }

  return <div onClick={handleClick}>{ItemContent}</div>;
}
