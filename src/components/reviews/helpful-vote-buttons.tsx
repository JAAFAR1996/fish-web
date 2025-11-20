'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { useAuth } from '@/components/providers/AuthProvider';
import { toggleHelpfulVoteAction } from '@/lib/reviews/review-actions';
import { cn } from '@/lib/utils';
import type { HelpfulVote, Review } from '@/types';

export interface HelpfulVoteButtonsProps {
  review: Review;
  userVote: HelpfulVote | null;
  onVoteChange?: () => void;
  className?: string;
}

const extractTranslationKey = (errorKey: string): string => {
  if (!errorKey) return 'errors.submitFailed';
  return errorKey.startsWith('reviews.') ? errorKey.replace('reviews.', '') : errorKey;
};

export function HelpfulVoteButtons({
  review,
  userVote,
  onVoteChange,
  className,
}: HelpfulVoteButtonsProps) {
  const t = useTranslations('reviews');
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingVote, setPendingVote] = useState<'helpful' | 'not_helpful' | null>(null);

  const helpfulActive = userVote?.vote_type === 'helpful';
  const notHelpfulActive = userVote?.vote_type === 'not_helpful';

  const handleVote = (voteType: 'helpful' | 'not_helpful') => {
    if (!user) {
      setError(t('errors.authRequired'));
      return;
    }

    setError(null);
    setPendingVote(voteType);
    startTransition(async () => {
      const result = await toggleHelpfulVoteAction(review.id, voteType);

      if (!result.success) {
        setError(t(extractTranslationKey(result.error ?? 'errors.submitFailed')));
        setPendingVote(null);
        return;
      }

      setPendingVote(null);
      onVoteChange?.();
    });
  };

  return (
    <div
      className={cn(
        'mt-4 flex flex-col gap-2 rounded-lg border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name="help" className="h-4 w-4" />
        <span>{t('helpful.wasHelpful')}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={helpfulActive ? 'primary' : 'ghost'}
          className={cn(helpfulActive && 'helpful-vote-active')}
          onClick={() => handleVote('helpful')}
          aria-pressed={helpfulActive}
          loading={isPending && pendingVote === 'helpful'}
          disabled={isPending}
        >
          <Icon name="star" className="h-4 w-4" />
          <span>
            {t('helpful.helpful')} ({review.helpful_count})
          </span>
        </Button>
        <Button
          size="sm"
          variant={notHelpfulActive ? 'outline' : 'ghost'}
          className={cn(notHelpfulActive && 'helpful-vote-active')}
          onClick={() => handleVote('not_helpful')}
          aria-pressed={notHelpfulActive}
          loading={isPending && pendingVote === 'not_helpful'}
          disabled={isPending}
        >
          <Icon name="thumbs-down" className="h-4 w-4" />
          <span>
            {t('helpful.notHelpful')} ({review.not_helpful_count})
          </span>
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-sm text-coral-600 dark:text-coral-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
