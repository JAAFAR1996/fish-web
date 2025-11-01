'use client';

import { useTranslations } from 'next-intl';
import type { CategoryKey } from '@/components/layout/navigation-data';

interface FeaturedCategoryClientProps {
  category: CategoryKey;
  count: number;
  icon: string;
}

export function FeaturedCategoryClient({ category, count, icon }: FeaturedCategoryClientProps) {
  const t = useTranslations('home.categories');
  
  return (
    <>
      <span className="text-lg font-medium">{t(category)}</span>
      <span className="text-sm text-muted-foreground">
        {t('count', { count })}
      </span>
    </>
  );
}