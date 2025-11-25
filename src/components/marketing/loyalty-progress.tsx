'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import type { LoyaltyPointsSummary } from '@/types';
import { MIN_POINTS_REDEMPTION } from '@/lib/marketing/constants';
import { cn } from '@/lib/utils';

interface LoyaltyProgressProps {
  summary: LoyaltyPointsSummary | null;
  className?: string;
  compact?: boolean;
}

export function LoyaltyProgress({ summary, className, compact = false }: LoyaltyProgressProps) {
  const t = useTranslations('marketing.loyalty');
  const balance = summary?.balance ?? 0;

  const nextGoal = useMemo(() => {
    if (balance <= 0) return MIN_POINTS_REDEMPTION;
    const multiplier = Math.max(1, Math.ceil(balance / MIN_POINTS_REDEMPTION));
    return multiplier * MIN_POINTS_REDEMPTION;
  }, [balance]);

  const progress = Math.min(1, balance / nextGoal);
  const readyToRedeem = balance >= MIN_POINTS_REDEMPTION;

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card p-4 shadow-sm',
        compact && 'p-3',
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aqua-500/15 text-aqua-700 dark:text-aqua-200">
            ★
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {readyToRedeem ? t('readyToRedeem') : t('progressTitle')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('progressSubtitle', { next: nextGoal })}
            </p>
          </div>
        </div>
        <div className="text-sm font-semibold text-aqua-700 dark:text-aqua-200">
          {t('pointsShort', { points: balance })}
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-aqua-500 transition-all"
          style={{ width: `${Math.max(progress * 100, 6)}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{t('minRedemption', { points: MIN_POINTS_REDEMPTION })}</span>
        {readyToRedeem && (
          <span className="text-foreground">{t('readyLabel')}</span>
        )}
      </div>
    </div>
  );
}
