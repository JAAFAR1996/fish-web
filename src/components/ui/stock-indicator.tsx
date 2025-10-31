'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

export type StockIndicatorProps = {
  stock: number;
  lowStockThreshold: number;
  showProgressBar?: boolean;
  className?: string;
};

export function StockIndicator({
  stock,
  lowStockThreshold,
  showProgressBar = true,
  className,
}: StockIndicatorProps) {
  const t = useTranslations('product.stock');

  const isVisible = stock > 0 && stock <= lowStockThreshold;
  const percentage = useMemo(() => {
    if (!lowStockThreshold || lowStockThreshold <= 0) {
      return 0;
    }
    const ratio = Math.min(stock / lowStockThreshold, 1);
    return Math.max(ratio, 0) * 100;
  }, [stock, lowStockThreshold]);

  if (!isVisible) {
    return null;
  }

  const isCritical = stock <= Math.max(2, Math.floor(lowStockThreshold / 3));

  return (
    <div
      className={cn(
        'flex flex-col gap-2 text-xs font-medium text-coral-600 dark:text-coral-300',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1.5">
        <Icon
          name="alert"
          size="sm"
          className="text-coral-500 dark:text-coral-300"
          aria-hidden="true"
        />
        <span>{t('lowStock', { count: stock })}</span>
      </div>

      {showProgressBar && (
        <div
          className={cn(
            'h-1.5 w-full overflow-hidden rounded-full bg-muted',
            isCritical && 'motion-safe:animate-pulse-slow'
          )}
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-coral-500 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
