'use client';

import { useTranslations } from 'next-intl';
import type { CategoryKey } from '@/components/layout/navigation-data';
import type { IconName } from '@/components/ui';

interface CategoryData {
  key: CategoryKey;
  iconName: IconName;
  imageSrc: string;
  count: number;
}

interface FeaturedCategoryClientProps {
  headingId: string;
  categories: CategoryData[];
}

export function FeaturedCategoryClient({ headingId, categories }: FeaturedCategoryClientProps) {
  const t = useTranslations('home.categories');

  return (
    <>
      <h2 id={headingId} className="text-3xl font-bold tracking-tight">
        {t('title')}
      </h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map(({ key, count }) => (
          <div key={key} className="text-center">
            <span className="text-lg font-medium">{t(key)}</span>
            <span className="text-sm text-muted-foreground">
              {t('count', { count })}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}