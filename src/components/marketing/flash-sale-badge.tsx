'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Icon } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import { CountdownTimer } from './countdown-timer';
import type { FlashSale, Locale } from '@/types';

interface FlashSaleBadgeProps {
  flashSale: FlashSale;
  className?: string;
  locale?: Locale;
}

export function FlashSaleBadge({ flashSale, className, locale: localeProp }: FlashSaleBadgeProps) {
  const currentLocale = useLocale() as Locale;
  const locale = localeProp ?? currentLocale;
  const t = useTranslations('marketing.flashSales');
  const [saleEnded, setSaleEnded] = useState(() => new Date(flashSale.ends_at) <= new Date());

  const { remainingStock, savings } = useMemo(() => {
    const remaining = Math.max(0, flashSale.stock_limit - flashSale.stock_sold);
    const saved = Math.max(0, flashSale.original_price - flashSale.flash_price);
    return { remainingStock: remaining, savings: saved };
  }, [flashSale]);

  const isSoldOut = remainingStock <= 0;
  const shouldShowCountdown = !saleEnded && !isSoldOut;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Icon name="zap" size="sm" className="shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {t('flashSale')}
        </span>
        {shouldShowCountdown ? (
          <CountdownTimer
            key={flashSale.id}
            endsAt={flashSale.ends_at}
            className="ms-auto"
            onComplete={() => setSaleEnded(true)}
          />
        ) : (
          <span className="ms-auto text-[11px] font-semibold uppercase text-destructive">
            {isSoldOut ? t('soldOut') : t('ended')}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-destructive/80">
        {savings > 0 && (
          <span>{t('save', { amount: formatCurrency(savings, locale) })}</span>
        )}
        {!isSoldOut && !saleEnded && (
          <span>{t('limitedStock', { remaining: remainingStock })}</span>
        )}
      </div>
    </div>
  );
}
