'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Icon,
  StarRating,
} from '@/components/ui';
import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { ImageLightbox } from '@/components/pdp/image-lightbox';
import { canEditReview } from '@/lib/reviews/review-validation';
import { formatReviewDate } from '@/lib/reviews/review-utils';
import { cn } from '@/lib/utils';
import type {
  HelpfulVote,
  Locale,
  ReviewWithUser,
} from '@/types';

import { HelpfulVoteButtons } from './helpful-vote-buttons';

export interface ReviewItemProps {
  review: ReviewWithUser;
  userVote: HelpfulVote | null;
  locale: Locale;
  productName: string;
  onVoteChange?: () => void;
  onEdit?: (review: ReviewWithUser) => void;
  onDelete?: (review: ReviewWithUser) => void;
  highlightQuery?: string | null;
  className?: string;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function ReviewItem({
  review,
  userVote,
  locale,
  productName,
  onVoteChange,
  onEdit,
  onDelete,
  highlightQuery,
  className,
}: ReviewItemProps) {
  const t = useTranslations('reviews');
  const { user } = useAuth();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const isOwner = user?.id === review.user_id;
  const editable = isOwner && canEditReview(review.created_at);

  const formattedDate = useMemo(
    () => formatReviewDate(review.created_at, locale),
    [locale, review.created_at],
  );

  const reviewerInitials = useMemo(() => {
    if (review.user?.full_name) {
      return review.user.full_name
        .split(' ')
        .map((segment) => segment.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
    }

    return review.user?.id.slice(0, 2).toUpperCase() ?? 'U';
  }, [review.user]);

  const highlightText = (text: string) => {
    if (!highlightQuery || !highlightQuery.trim()) {
      return text;
    }

    const pattern = new RegExp(`(${escapeRegExp(highlightQuery)})`, 'gi');
    const parts = text.split(pattern);

    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <mark key={`${part}-${index}`} className="rounded bg-yellow-200 px-1 text-foreground">
          {part}
        </mark>
      ) : (
        <span key={`${part}-${index}`}>{part}</span>
      ),
    );
  };

  return (
    <article
      className={cn(
        'space-y-4 rounded-xl border border-border bg-card/60 p-6 shadow-sm transition hover:shadow-md',
        className,
      )}
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aqua-500/20 text-base font-semibold text-aqua-500">
            {review.user?.avatar_url ? (
              <Image
                src={review.user.avatar_url}
                alt={review.user.full_name ?? 'Reviewer avatar'}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              reviewerInitials
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {review.user?.full_name ?? t('yourReview')}
            </p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!review.is_approved && (
            <Badge variant="warning">{t('moderation.pending')}</Badge>
          )}
          {editable && (
            <Badge variant="info">{t('moderation.awaitingApproval')}</Badge>
          )}
        </div>
      </header>

      <div className="space-y-3">
        <StarRating rating={review.rating} size="md" showValue />
        <h4 className="text-lg font-semibold text-foreground">
          {highlightText(review.title)}
        </h4>
        <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
          {highlightText(review.comment)}
        </p>
      </div>

      {Array.isArray(review.images) && review.images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {review.images.map((imageUrl, index) => (
            <button
              key={`${imageUrl}-${index}`}
              type="button"
              className="group relative aspect-square overflow-hidden rounded-lg border border-border"
              onClick={() => {
                setLightboxIndex(index);
                setLightboxOpen(true);
              }}
            >
              <Image
                src={imageUrl}
                alt={t('form.images')}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105 review-image-hover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition group-hover:opacity-100">
                <Icon name="zoom-in" className="h-5 w-5 text-white" />
              </div>
            </button>
          ))}
        </div>
      )}

      <HelpfulVoteButtons
        review={review}
        userVote={userVote}
        onVoteChange={onVoteChange}
      />

      {(editable || (isOwner && onDelete)) && (
        <div className="flex items-center justify-end gap-2">
          {editable && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(review)}
            >
              <Icon name="edit" className="h-4 w-4" />
              {t('form.update')}
            </Button>
          )}
          {isOwner && onDelete && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete?.(review)}
            >
              <Icon name="trash" className="h-4 w-4" />
              {t('form.delete')}
            </Button>
          )}
        </div>
      )}

      <ImageLightbox
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        images={review.images ?? []}
        initialIndex={lightboxIndex}
        productName={productName}
      />
    </article>
  );
}
