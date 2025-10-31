'use client';

import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface EmptyReviewsProps {
  onWriteReview?: () => void;
  showWriteButton?: boolean;
  className?: string;
}

export function EmptyReviews({
  onWriteReview,
  showWriteButton = true,
  className,
}: EmptyReviewsProps) {
  const t = useTranslations('reviews');

  return (
    <div
      className={cn(
        'flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-muted/30 p-10 text-center',
        className,
      )}
    >
      <Icon name="star" className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-1">
        <h4 className="text-xl font-semibold text-foreground">
          {t('empty.noReviews')}
        </h4>
        <p className="text-sm text-muted-foreground">
          {t('empty.beFirst')}
        </p>
        <p className="text-xs text-muted-foreground/80">
          {t('empty.shareExperience')}
        </p>
      </div>
      {showWriteButton && onWriteReview && (
        <Button variant="primary" size="sm" onClick={onWriteReview}>
          <Icon name="edit" className="h-4 w-4" />
          {t('writeReview')}
        </Button>
      )}
    </div>
  );
}
