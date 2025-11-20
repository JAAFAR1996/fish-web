'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { CategoryKey } from '@/components/layout/navigation-data';
import type { IconName } from '@/components/ui';
import { useGSAP, gsap, PRESETS, STAGGER } from '@/hooks/useGSAP';
import { FEATURES } from '@/lib/config/features';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!FEATURES.gsap || !categories.length) {
      return;
    }

    if (headingRef.current) {
      gsap.from(headingRef.current, {
        opacity: 0,
        y: 20,
        duration: PRESETS.heroTitle.duration / 1000,
        ease: PRESETS.heroTitle.gsapEase,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 85%',
          once: true,
        },
      });
    }

    if (gridRef.current) {
      const items = Array.from(gridRef.current.children);
      gsap.from(items, {
        opacity: 0,
        y: 30,
        duration: PRESETS.productCard.duration / 1000,
        ease: PRESETS.productCard.cssEasing,
        stagger: STAGGER.normal / 1000,
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
          once: true,
        },
      });
    }
  }, { scope: containerRef });

  return (
    <div ref={containerRef}>
      <h2
        ref={headingRef}
        id={headingId}
        className="text-3xl font-bold tracking-tight"
        data-gsap="categories-heading"
      >
        {t('title')}
      </h2>
      <div
        ref={gridRef}
        className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
        data-gsap="categories-grid"
      >
        {categories.map(({ key, count }) => (
          <div key={key} className="text-center" data-gsap="category-card">
            <span className="text-lg font-medium">{t(key)}</span>
            <span className="text-sm text-muted-foreground">
              {t('count', { count })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
