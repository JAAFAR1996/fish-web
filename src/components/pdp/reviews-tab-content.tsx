'use client';

import {
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import {
  deleteReviewAction,
} from '@/lib/reviews/review-actions';
import { cn } from '@/lib/utils';
import type {
  HelpfulVote,
  Locale,
  ReviewSummary as ReviewSummaryType,
  ReviewWithUser,
} from '@/types';

import {
  EmptyReviews,
  ReviewForm,
  ReviewList,
  ReviewSummary,
} from '@/components/reviews';

export interface ReviewsTabContentProps {
  productId: string;
  productSlug: string;
  productName: string;
  reviews: ReviewWithUser[];
  reviewSummary: ReviewSummaryType;
  userVotes: Record<string, HelpfulVote>;
  locale: Locale;
  className?: string;
}

export function ReviewsTabContent({
  productId,
  productSlug,
  productName,
  reviews,
  reviewSummary,
  userVotes,
  locale,
  className,
}: ReviewsTabContentProps) {
  const t = useTranslations('reviews');
  const router = useRouter();
  const { user } = useAuth();

  const translateKey = (key: string) => {
    const normalized = key.startsWith('reviews.') ? key.replace('reviews.', '') : key;
    try {
      return t(normalized);
    } catch {
      return t('errors.submitFailed');
    }
  };

  const productReviewsPath = `/${locale}/products/${productSlug}`;

  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewWithUser | null>(null);
  const [activeRatingFilter, setActiveRatingFilter] = useState<number | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const userReview = useMemo(
    () => reviews.find((review) => review.user_id === user?.id) ?? null,
    [reviews, user?.id],
  );

  const hasReviewed = Boolean(userReview);

  const handleWriteReview = () => {
    setEditingReview(userReview);
    setShowForm(true);
  };

  const handleReviewSuccess = () => {
    setShowForm(false);
    setEditingReview(null);
    router.refresh();
  };

  const handleVoteChange = () => {
    router.refresh();
  };

  const handleEditReview = (review: ReviewWithUser) => {
    setEditingReview(review);
    setShowForm(true);
  };

  const handleDeleteReview = (review: ReviewWithUser) => {
    if (isDeleting) return;

    const confirmation = window.confirm(translateKey('errors.deleteConfirm'));

    if (!confirmation) {
      return;
    }

    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteReviewAction(review.id, {
        revalidatePath: productReviewsPath,
      });
      if (!result.success) {
        setDeleteError(result.error ? translateKey(result.error) : t('errors.submitFailed'));
        return;
      }

      setDeleteError(null);
      router.refresh();
      setShowForm(false);
      setEditingReview(null);
    });
  };

  if (reviews.length === 0 && !showForm) {
    return (
      <div className={cn('space-y-6', className)}>
        <EmptyReviews
          onWriteReview={user ? handleWriteReview : undefined}
          showWriteButton={Boolean(user)}
        />
        {!user && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            {t('errors.authRequired')}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-8', className)}>
      <ReviewSummary
        summary={reviewSummary}
        onFilterByRating={setActiveRatingFilter}
        activeRating={activeRatingFilter}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h4 className="text-lg font-semibold text-foreground">
            {t('customerReviews')}
          </h4>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {user && (
          <Button variant={hasReviewed ? 'outline' : 'primary'} size="sm" onClick={handleWriteReview}>
            <Icon name="edit" className="h-4 w-4" />
            {hasReviewed ? t('form.update') : t('writeReview')}
          </Button>
        )}
      </div>

      {!user && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          {t('errors.authRequired')}
        </div>
      )}

      {showForm && user && (
        <ReviewForm
          productId={productId}
          existingReview={editingReview}
          onSuccess={handleReviewSuccess}
          onCancel={() => {
            setShowForm(false);
            setEditingReview(null);
          }}
          revalidatePath={productReviewsPath}
        />
      )}

      {deleteError && (
        <div className="rounded-md border border-coral-500 bg-coral-500/10 p-3 text-sm text-coral-600 dark:border-coral-500/60 dark:text-coral-300">
          {deleteError}
        </div>
      )}

      <ReviewList
        reviews={reviews}
        userVotes={userVotes}
        locale={locale}
        productName={productName}
        onVoteChange={handleVoteChange}
        onEditReview={handleEditReview}
        onDeleteReview={handleDeleteReview}
        activeRatingFilter={activeRatingFilter}
        onRatingFilterChange={setActiveRatingFilter}
      />
    </div>
  );
}
