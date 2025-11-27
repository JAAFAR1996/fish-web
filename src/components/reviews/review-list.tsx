'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { filterReviewsByRating, filterVerifiedReviews, sortReviews } from '@/lib/reviews/review-utils';
import { REVIEWS_PER_PAGE } from '@/lib/reviews/constants';
import { cn } from '@/lib/utils';
import type {
  HelpfulVote,
  Locale,
  ReviewFilters as ReviewFiltersType,
  ReviewWithUser,
} from '@/types';

import { ReviewFilters } from './review-filters';
import { ReviewItem } from './review-item';
import { EmptyReviews } from './empty-reviews';
import { ReviewWithImages } from './ReviewWithImages';

const DEFAULT_FILTERS: ReviewFiltersType = {
  rating: null,
  sortBy: 'recent',
  withImages: false,
  verified: false,
};

interface ReviewListProps {
  reviews: ReviewWithUser[];
  userVotes: Record<string, HelpfulVote>;
  locale: Locale;
  productName: string;
  onVoteChange?: () => void;
  onEditReview?: (review: ReviewWithUser) => void;
  onDeleteReview?: (review: ReviewWithUser) => void;
  highlightQuery?: string | null;
  activeRatingFilter?: number | null;
  onRatingFilterChange?: (rating: number | null) => void;
  className?: string;
}

const ITEMS_PER_PAGE = REVIEWS_PER_PAGE;

export function ReviewList({
  reviews,
  userVotes,
  locale,
  productName,
  onVoteChange,
  onEditReview,
  onDeleteReview,
  highlightQuery,
  activeRatingFilter,
  onRatingFilterChange,
  className,
}: ReviewListProps) {
  const t = useTranslations('reviews');
  const [filters, setFilters] = useState<ReviewFiltersType>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  const handleFiltersChange = (nextFilters: ReviewFiltersType) => {
    setFilters(nextFilters);
    setPage(1);
    onRatingFilterChange?.(nextFilters.rating ?? null);
  };

  useEffect(() => {
    if (typeof activeRatingFilter === 'number' || activeRatingFilter === null) {
      setFilters((current) => {
        if (current.rating === activeRatingFilter) {
          return current;
        }
        return {
          ...current,
          rating: activeRatingFilter,
        };
      });
      setPage(1);
    }
  }, [activeRatingFilter]);

  const filteredReviews = useMemo(() => {
    let result = reviews;

    if (filters.rating) {
      result =
        filters.rating >= 5
          ? result.filter((review) => review.rating === 5)
          : filterReviewsByRating(result, filters.rating);
    }

    if (filters.withImages) {
      result = result.filter(
        (review) => Array.isArray(review.images) && review.images.length > 0,
      );
    }

    if (filters.verified) {
      result = filterVerifiedReviews(result);
    }

    return sortReviews(result, filters.sortBy);
  }, [filters.rating, filters.sortBy, filters.withImages, filters.verified, reviews]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReviews.length / ITEMS_PER_PAGE),
  );

  const paginatedReviews = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReviews, page]);

  const usePhotoMode = Boolean(filters.withImages);

  if (reviews.length === 0) {
    return (
      <EmptyReviews
        showWriteButton={false}
        className={className}
      />
    );
  }

  const showNoMatches = filteredReviews.length === 0 && reviews.length > 0;

  return (
    <section className={cn('space-y-6', className)}>
      <ReviewFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        totalReviews={reviews.length}
      />

      {showNoMatches ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted/40 p-8 text-center">
          <Icon name="search" className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t('errors.noMatches')}</p>
          <Button variant="outline" size="sm" onClick={() => handleFiltersChange(DEFAULT_FILTERS)}>
            {t('filters.clear')}
          </Button>
        </div>
      ) : usePhotoMode ? (
        <ReviewWithImages reviews={paginatedReviews} />
      ) : (
        <div className="space-y-5">
          {paginatedReviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              userVote={userVotes[review.id] ?? null}
              locale={locale}
              productName={productName}
              onVoteChange={onVoteChange}
              onEdit={onEditReview}
              onDelete={onDeleteReview}
              highlightQuery={highlightQuery}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between rounded-lg border border-border bg-card/70 px-4 py-3 text-sm"
          aria-label="Review pagination"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
            aria-label={t('pagination.previous')}
          >
            <Icon name="chevron-left" className="h-4 w-4" />
            <span>{t('pagination.previous')}</span>
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page === totalPages}
            aria-label={t('pagination.next')}
          >
            <span>{t('pagination.next')}</span>
            <Icon name="chevron-right" className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </section>
  );
}
