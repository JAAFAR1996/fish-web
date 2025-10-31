'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Icon, Popover, PopoverContent, PopoverTrigger, ScrollArea } from '@/components/ui';
import { NotificationItem } from './notification-item';
import { EmptyNotifications } from './empty-notifications';
import { useNotifications } from '@/components/providers/NotificationProvider';
import { MAX_NOTIFICATIONS_DROPDOWN } from '@/lib/notifications/constants';
import { cn } from '@/lib/utils';

export function NotificationCenter() {
  const t = useTranslations('notifications');
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification, clearAll } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const displayNotifications = notifications.slice(0, MAX_NOTIFICATIONS_DROPDOWN);
  const hasNotifications = notifications.length > 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t('notificationCenter')}
        >
          <Icon name={unreadCount > 0 ? 'bell-dot' : 'bell'} size="md" />
          {unreadCount > 0 && (
            <span className="absolute top-1 end-1 flex h-5 w-5 items-center justify-center rounded-full bg-aqua-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] p-0"
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-foreground">
            {t('notificationCenter')}
          </h3>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {t('unreadCount', { count: unreadCount })}
            </span>
          )}
        </div>

        {hasNotifications && (
          <div className="flex items-center justify-end gap-2 border-b px-4 py-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await markAllAsRead();
                }}
                className="h-8 text-xs"
              >
                {t('markAllAsRead')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                if (window.confirm(t('clearAll') + '?')) {
                  await clearAll();
                }
              }}
              className="h-8 text-xs text-destructive hover:text-destructive"
            >
              {t('clearAll')}
            </Button>
          </div>
        )}

        <ScrollArea className={cn('overflow-y-auto', hasNotifications && 'h-[400px]')}>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Icon name="loader" className="animate-spin text-muted-foreground" size="lg" />
            </div>
          ) : !hasNotifications ? (
            <EmptyNotifications />
          ) : (
            <div className="divide-y">
              {displayNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))}
            </div>
          )}
        </ScrollArea>

        {hasNotifications && notifications.length > MAX_NOTIFICATIONS_DROPDOWN && (
          <div className="border-t px-4 py-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-xs text-aqua-500 hover:text-aqua-600"
            >
              {t('viewAll')} ({notifications.length})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
