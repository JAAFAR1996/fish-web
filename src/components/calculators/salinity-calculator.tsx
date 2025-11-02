'use client';

import { useTranslations } from 'next-intl';
import { Icon, Badge } from '@/components/ui';

export function SalinityCalculator() {
  const t = useTranslations('calculators.salinity');

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
      <Icon name="droplet" className="w-16 h-16 text-sand-400 dark:text-sand-600 mb-4" />
      
      <h2 className="text-2xl font-bold text-sand-900 dark:text-sand-100 mb-2">
        {t('title')}
      </h2>
      
      <Badge variant="info" className="mb-4">
        {t('comingSoon')}
      </Badge>
      
      <p className="text-sand-600 dark:text-sand-400 max-w-md">
        {t('comingSoonDescription')}
      </p>
    </div>
  );
}
