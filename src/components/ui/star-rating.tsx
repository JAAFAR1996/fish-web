'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

type StarRatingSize = 'sm' | 'md' | 'lg';

const STAR_SIZE_MAP: Record<StarRatingSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
};

export type StarRatingProps = {
  rating: number;
  maxRating?: number;
  size?: StarRatingSize;
  showValue?: boolean;
  reviewCount?: number | null;
  className?: string;
};

export function StarRating({
  rating,
  maxRating = 5,
  size = 'sm',
  showValue = false,
  reviewCount,
  className,
}: StarRatingProps) {
  const t = useTranslations('product.rating');
  const iconSize = STAR_SIZE_MAP[size] ?? STAR_SIZE_MAP.sm;

  const clampedRating = useMemo(
    () => Math.min(Math.max(rating, 0), maxRating),
    [rating, maxRating]
  );

  const stars = useMemo(
    () =>
      Array.from({ length: maxRating }, (_, index) => {
        const progress = Math.min(
          Math.max(clampedRating - index, 0),
          1
        );
        return { progress, index };
      }),
    [clampedRating, maxRating]
  );

  const ariaLabel = t('stars', {
    rating: clampedRating.toFixed(1).replace(/\.0$/, ''),
  });

  return (
    <div
      className={cn(
        'flex items-center gap-2 text-xs text-muted-foreground',
        className
      )}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="flex items-center gap-1">
        {stars.map(({ progress, index }) => (
          <span key={index} className="relative inline-flex">
            <Icon
              name="star"
              size={iconSize}
              className="text-gray-300 dark:text-gray-600"
              strokeWidth={1.5}
            />
            {progress > 0 && (
              <span
                className="absolute inset-0 overflow-hidden text-yellow-400"
                style={{ width: `${progress * 100}%` }}
              >
                <Icon
                  name="star"
                  size={iconSize}
                  strokeWidth={1.5}
                  fill="currentColor"
                />
              </span>
            )}
          </span>
        ))}
      </div>

      {showValue && (
        <span className="font-medium text-foreground">
          {clampedRating.toFixed(1).replace(/\.0$/, '')}{' '}
          <span className="sr-only">{t('outOf')}</span>
        </span>
      )}

      {typeof reviewCount === 'number' &&
        (reviewCount > 0 ? (
          <span aria-hidden="true">
            {t('reviews', { count: reviewCount })}
          </span>
        ) : (
          <span aria-hidden="true">{t('noReviews')}</span>
        ))}
    </div>
  );
}
