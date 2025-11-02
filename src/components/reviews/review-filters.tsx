'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Icon,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ReviewFilters as ReviewFiltersType } from '@/types';

const SORT_OPTIONS: Array<ReviewFiltersType['sortBy']> = [
  'recent',
  'helpful',
  'highest',
  'lowest',
];

export interface ReviewFiltersProps {
  filters: ReviewFiltersType;
  onFiltersChange: (filters: ReviewFiltersType) => void;
  totalReviews: number;
  className?: string;
}

export function ReviewFilters({
  filters,
  onFiltersChange,
  totalReviews,
  className,
}: ReviewFiltersProps) {
  const t = useTranslations('reviews');

  const activeRatingLabel = useMemo(() => {
    if (filters.rating === null || filters.rating === undefined) return null;
    if (filters.rating === 5) return t('filters.5stars');
    if (filters.rating === 4) return t('filters.4stars');
    if (filters.rating === 3) return t('filters.3stars');
    return `${filters.rating}+`;
  }, [filters.rating, t]);

  const handleRatingChange = (rating: number | null) => {
    if (filters.rating === rating) {
      onFiltersChange({ ...filters, rating: null });
    } else {
      onFiltersChange({ ...filters, rating });
    }
  };

  const handleToggleWithImages = () => {
    onFiltersChange({ ...filters, withImages: !filters.withImages });
  };

  const handleToggleVerified = () => {
    onFiltersChange({ ...filters, verified: !filters.verified });
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-card/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">
          {t('customerReviews')} ({totalReviews})
        </span>
        <div
          role="group"
          aria-label={t('ratingDistribution')}
          className="flex flex-wrap items-center gap-2"
        >
          <Button
            size="sm"
            variant={filters.rating === null ? 'primary' : 'outline'}
            onClick={() => handleRatingChange(null)}
            aria-pressed={filters.rating === null}
          >
            {t('filters.all')}
          </Button>
          <Button
            size="sm"
            variant={filters.rating === 5 ? 'primary' : 'outline'}
            onClick={() => handleRatingChange(5)}
            aria-pressed={filters.rating === 5}
          >
            {t('filters.5stars')}
          </Button>
          <Button
            size="sm"
            variant={filters.rating === 4 ? 'primary' : 'outline'}
            onClick={() => handleRatingChange(4)}
            aria-pressed={filters.rating === 4}
          >
            {t('filters.4stars')}
          </Button>
          <Button
            size="sm"
            variant={filters.rating === 3 ? 'primary' : 'outline'}
            onClick={() => handleRatingChange(3)}
            aria-pressed={filters.rating === 3}
          >
            {t('filters.3stars')}
          </Button>
        </div>
        <Button
          size="sm"
          variant={filters.withImages ? 'primary' : 'outline'}
          onClick={handleToggleWithImages}
          aria-pressed={Boolean(filters.withImages)}
        >
          <Icon name="image" className="mr-1 h-4 w-4" />
          {t('filters.withImages')}
        </Button>
        {/* Verified purchase filter hidden until backend support is implemented */}
        {false && (
          <Button
            size="sm"
            variant={filters.verified ? 'primary' : 'outline'}
            onClick={handleToggleVerified}
            aria-pressed={Boolean(filters.verified)}
          >
            <Icon name="shield-check" className="mr-1 h-4 w-4" />
            {t('filters.verified')}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {(filters.rating !== null && filters.rating !== undefined) && (
          <Badge variant="outline" className="flex items-center gap-2">
            <Icon name="filter" className="h-3.5 w-3.5" />
            <span>{activeRatingLabel}</span>
            <button
              type="button"
              className="ml-1 text-xs text-muted-foreground transition hover:text-foreground"
              onClick={() => handleRatingChange(null)}
              aria-label={t('filters.clear')}
            >
              <Icon name="close" className="h-3 w-3" />
            </button>
          </Badge>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <span className="mr-2">{t('sort.' + filters.sortBy)}</span>
              <Icon name="chevron-down" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option}
                onSelect={() => onFiltersChange({ ...filters, sortBy: option })}
                className="flex items-center gap-2"
              >
                <Icon
                  name={
                    option === 'recent'
                      ? 'clock'
                      : option === 'helpful'
                        ? 'thumbs-up'
                        : option === 'highest'
                          ? 'arrow-up'
                          : 'arrow-down'
                  }
                  className="h-4 w-4 text-muted-foreground"
                />
                <span>{t(`sort.${option}`)}</span>
                {filters.sortBy === option && (
                  <Icon name='check' className="ml-auto h-4 w-4 text-aqua-500" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
