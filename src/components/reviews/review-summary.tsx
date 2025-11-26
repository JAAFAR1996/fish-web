'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  ProgressBar,
  StarRating,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ReviewSummary } from '@/types';

const RATINGS: Array<1 | 2 | 3 | 4 | 5> = [5, 4, 3, 2, 1];

const getStatusForRating = (rating: number): 'optimal' | 'adequate' | 'insufficient' => {
  if (rating >= 4) return 'optimal';
  if (rating === 3) return 'adequate';
  return 'insufficient';
};

export interface ReviewSummaryProps {
  summary: ReviewSummary;
  onFilterByRating?: (rating: number | null) => void;
  activeRating?: number | null;
  className?: string;
}

export function ReviewSummary({
  summary,
  onFilterByRating,
  activeRating = null,
  className,
}: ReviewSummaryProps) {
  const t = useTranslations('reviews');

  const averageRating = useMemo(
    () => (summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : '0.0'),
    [summary.averageRating, summary.totalReviews],
  );

  const totalReviews = summary.totalReviews;
  const safeTotal = totalReviews > 0 ? totalReviews : 1;

  return (
    <section
      aria-label={t('title')}
      className={cn(
        'rounded-xl border border-border bg-card p-6 shadow-sm',
        className,
      )}
    >
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="flex w-full flex-col items-start gap-3 md:max-w-[220px]">
          <div className="text-5xl font-semibold text-aqua-500">{averageRating}</div>
          <StarRating rating={summary.averageRating} size="lg" showValue={false} />
          <Badge variant="outline" className="text-xs font-medium uppercase tracking-wide">
            {t('basedOn', { count: totalReviews })}
          </Badge>
        </div>

        <div className="flex-1 space-y-3">
          {RATINGS.map((rating) => {
            const count = summary.ratingDistribution[rating];
            const percentage = Math.round((count / safeTotal) * 100);
            const isActive = activeRating === rating;

            return (
              <div
                key={rating}
                className={cn(
                  'flex items-center gap-4 rounded-md border border-transparent p-2 transition-colors',
                  onFilterByRating && 'cursor-pointer hover:border-aqua-200 dark:hover:border-aqua-800',
                  isActive && 'border-aqua-300 bg-aqua-50/60 dark:border-aqua-700 dark:bg-aqua-900/20',
                )}
                onClick={() => onFilterByRating?.(rating === activeRating ? null : rating)}
                role={onFilterByRating ? 'button' : undefined}
                tabIndex={onFilterByRating ? 0 : undefined}
                aria-pressed={onFilterByRating ? isActive : undefined}
                onKeyDown={(event) => {
                  if (!onFilterByRating) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onFilterByRating(rating === activeRating ? null : rating);
                  }
                }}
              >
                <span className="w-14 shrink-0 text-sm font-semibold text-muted-foreground">
                  {t('stars', { count: rating })}
                </span>
                <div className="flex-1">
                  <ProgressBar
                    value={count}
                    max={safeTotal}
                    label={t('stars', { count: rating })}
                    unit=""
                    status={getStatusForRating(rating)}
                    showValue={false}
                    height="sm"
                  />
                </div>
                <span className="w-16 shrink-0 text-end text-sm font-medium text-muted-foreground">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {onFilterByRating && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          <Button
            size="sm"
            variant={activeRating === null ? 'primary' : 'outline'}
            onClick={() => onFilterByRating(null)}
          >
            {t('filters.all')}
          </Button>
          <Button
            size="sm"
            variant={activeRating === 5 ? 'primary' : 'outline'}
            onClick={() => onFilterByRating(activeRating === 5 ? null : 5)}
          >
            {t('filters.5stars')}
          </Button>
          <Button
            size="sm"
            variant={activeRating === 4 ? 'primary' : 'outline'}
            onClick={() => onFilterByRating(activeRating === 4 ? null : 4)}
          >
            {t('filters.4stars')}
          </Button>
          <Button
            size="sm"
            variant={activeRating === 3 ? 'primary' : 'outline'}
            onClick={() => onFilterByRating(activeRating === 3 ? null : 3)}
          >
            {t('filters.3stars')}
          </Button>
        </div>
      )}
    </section>
  );
}
