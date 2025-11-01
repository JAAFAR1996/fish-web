import Image from 'next/image';

import { Icon } from '@/components/ui/icon';
import { FeaturedCategoryClient } from './featured-category-client';
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
  const categoryCounts = await getCategoryCounts();

  return (
    <section
      aria-labelledby="featured-categories-heading"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8"
    >
      <div className="mb-10 text-center">
        <FeaturedCategoryClient 
          headingId="featured-categories-heading"
          categories={FEATURED_CATEGORIES.map(categoryKey => ({
            key: categoryKey,
            iconName: CATEGORY_ICONS[categoryKey],
            imageSrc: CATEGORY_IMAGES[categoryKey],
            count: categoryCounts[categoryKey] ?? 0,
          }))}
        />
      </div>
    </section>
  );
}

export default FeaturedCategories;
