'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui';

export function EmptyNotifications() {
  const t = useTranslations('notifications');

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 rounded-full bg-muted p-6">
        <Icon name="bell" className="text-muted-foreground" size="xl" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {t('noNotifications')}
      </h3>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t('emptyState')}
      </p>
    </div>
  );
}
