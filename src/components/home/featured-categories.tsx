import Image from 'next/image';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui/icon';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { CategoryKey } from '@/components/layout/navigation-data';
import { getCategoryCounts } from '@/lib/data/products';

const FEATURED_CATEGORIES: readonly CategoryKey[] = [
  'filters',
  'heaters',
  'plantLighting',
  'waterCare',
  'plantsFertilizers',
  'air',
] as const;

const CATEGORY_ICONS: Record<CategoryKey, Parameters<typeof Icon>[0]['name']> = {
  filters: 'filter',
  air: 'activity',
  heaters: 'thermometer',
  plantLighting: 'sun',
  hardscape: 'package',
  waterCare: 'droplet',
  plantsFertilizers: 'package',
  tests: 'beaker',
};

const CATEGORY_IMAGES: Record<CategoryKey, string> = {
  filters: '/images/categories/filters.svg',
  air: '/images/categories/air.svg',
  heaters: '/images/categories/heaters.svg',
  plantLighting: '/images/categories/plant-lighting.svg',
  hardscape: '/images/categories/hardscape.svg',
  waterCare: '/images/categories/water-care.svg',
  plantsFertilizers: '/images/categories/plants-fertilizers.svg',
  tests: '/images/categories/tests.svg',
};

export async function FeaturedCategories() {
  const t = useTranslations('home.featuredCategories');
  const tCategories = useTranslations('categories');
  const categoryCounts = await getCategoryCounts();

  return (
    <section
      aria-labelledby="featured-categories-heading"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mb-10 text-center">
        <h2
          id="featured-categories-heading"
          className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
        >
          {t('title')}
        </h2>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          {t('subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-6">
        {FEATURED_CATEGORIES.map((categoryKey) => {
          const iconName = CATEGORY_ICONS[categoryKey];
          const imageSrc = CATEGORY_IMAGES[categoryKey];
          const count = categoryCounts[categoryKey] ?? 0;
          const title = tCategories(`${categoryKey}.title`);

          return (
            <Link
              key={categoryKey}
              href={{
                pathname: '/products',
                query: { category: categoryKey },
              }}
              className={cn(
                'category-card-hover group relative flex min-h-[260px] overflow-hidden rounded-2xl text-white transition-transform',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-ring',
                'bg-muted'
              )}
            >
              <div className="absolute inset-0">
                <Image
                  src={imageSrc}
                  alt={title}
                  fill
                  sizes="(min-width: 1280px) 16vw, (min-width: 640px) 28vw, 45vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority={false}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
              </div>
              <div className="relative z-10 mt-auto flex w-full flex-col gap-4 p-5 sm:p-6 lg:p-7">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 shadow-lg">
                  <Icon name={iconName} size="md" className="text-white" aria-hidden="true" />
                </span>
                <div className="space-y-1 text-start">
                  <h3 className="text-lg font-semibold sm:text-xl">
                    {title}
                  </h3>
                  <p className="text-sm text-white/80">
                    {t('productsCount', { count })}
                  </p>
                </div>
                <span className="inline-flex items-center justify-start gap-1 text-sm font-medium text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {t('viewAll')}
                  <Icon name="arrow-right" size="sm" flipRtl />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default FeaturedCategories;
