'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Icon, ProgressBar } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Locale } from '@/types';
import { cn } from '@/lib/utils';
import { calculateFreeShippingProgress } from '@/lib/cart/cart-utils';

export type FreeShippingProgressProps = {
  subtotal: number;
  variant?: 'compact' | 'detailed';
  className?: string;
};

export function FreeShippingProgress({
  subtotal,
  variant = 'detailed',
  className,
}: FreeShippingProgressProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('cart.freeShipping');
  const progress = useMemo(
    () => calculateFreeShippingProgress(subtotal),
    [subtotal]
  );

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-md bg-aqua-500/10 px-3 py-2 text-xs text-aqua-700 dark:text-aqua-100',
          className
        )}
      >
        <Icon
          name={progress.qualified ? 'check' : 'truck'}
          size="sm"
          className="text-aqua-500"
        />
        <span>
          {progress.qualified
            ? t('qualified')
            : t('progress', {
              amount: formatCurrency(progress.remaining, locale),
            })}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-aqua-500/40 bg-aqua-500/10 p-4 text-sm text-aqua-900 dark:text-aqua-100',
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2 font-medium">
        <Icon
          name={progress.qualified ? 'check' : 'truck'}
          size="sm"
          className="text-aqua-600 dark:text-aqua-200"
        />
        <span>
          {progress.qualified
            ? t('qualified')
            : t('progress', {
              amount: formatCurrency(progress.remaining, locale),
            })}
        </span>
      </div>
      <ProgressBar
        max={100}
        value={progress.percentage}
        status={progress.qualified ? 'optimal' : 'adequate'}
        showValue={false}
        className="h-2 overflow-hidden rounded-full bg-aqua-500/20"
      />
    </div>
  );
}
