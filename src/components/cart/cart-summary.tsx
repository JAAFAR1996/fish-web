'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { formatCurrency } from '@/lib/utils';
import type { Locale } from '@/types';
import { cn } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/cart/constants';

export type CartSummaryProps = {
  subtotal: number;
  shipping: number;
  total: number;
  itemCount: number;
  onCheckout?: () => void;
  variant?: 'sidebar' | 'full';
  className?: string;
};

export function CartSummary({
  subtotal,
  shipping,
  total,
  itemCount,
  onCheckout,
  variant = 'full',
  className,
}: CartSummaryProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('cart.summary');
  const tRoot = useTranslations('cart');

  const formattedSubtotal = useMemo(
    () => formatCurrency(subtotal, locale),
    [locale, subtotal]
  );
  const formattedShipping = useMemo(
    () => formatCurrency(shipping, locale),
    [locale, shipping]
  );
  const shippingDisplay =
    shipping === 0 && subtotal < FREE_SHIPPING_THRESHOLD
      ? t('shippingCalculated')
      : shipping === 0
        ? t('shippingFree')
        : formattedShipping;
  const formattedTotal = useMemo(
    () => formatCurrency(total, locale),
    [locale, total]
  );

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
      return;
    }
    // Placeholder for future checkout integration.
  };

  return (
    <aside
      className={cn(
        'relative rounded-lg border border-border/60 bg-card p-5 shadow-sm pb-32 sm:pb-5',
        variant === 'full' && 'lg:sticky lg:top-24',
        className
      )}
    >
      <h2 className="text-lg font-semibold text-foreground">
        {t('title')}
      </h2>
      <div className="mt-4 space-y-3 text-sm text-foreground">
        <div className="flex items-center justify-between">
          <span>
            {t('subtotal')}
            {' ('}
            {itemCount === 1
              ? tRoot('itemsCountSingular')
              : tRoot('itemsCount', { count: itemCount })}
            {')'}
          </span>
          <span className="font-medium">{formattedSubtotal}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>{t('shipping')}</span>
          <span className={cn(shipping === 0 && subtotal >= FREE_SHIPPING_THRESHOLD && 'text-green-600')}>
            {shippingDisplay}
          </span>
        </div>
        <div className="border-t border-border/50 pt-3 text-base font-semibold">
          <div className="flex items-center justify-between">
            <span>{t('total')}</span>
            <span className="text-foreground">{formattedTotal}</span>
          </div>
        </div>
      </div>
      <Button
        type="button"
        variant="primary"
        size="lg"
        className="mt-4 w-full hidden sm:inline-flex"
        onClick={handleCheckout}
        disabled={itemCount === 0}
      >
        <Icon name="credit-card" size="sm" className="me-2" />
        {t('proceedToCheckout')}
      </Button>
      {variant === 'full' && (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="mt-2 hidden w-full sm:inline-flex"
          asChild
        >
          <Link href="/products">
            <Icon name="arrow-left" size="sm" className="me-2" flipRtl />
            {t('continueShopping')}
          </Link>
        </Button>
      )}

      <div className="fixed inset-x-4 bottom-24 z-40 sm:hidden">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full shadow-lg"
          onClick={handleCheckout}
          disabled={itemCount === 0}
        >
          <Icon name="credit-card" size="sm" className="me-2" />
          {t('proceedToCheckout')}
        </Button>
        {variant === 'full' && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="mt-2 w-full shadow-sm"
            asChild
          >
            <Link href="/products">
              <Icon name="arrow-left" size="sm" className="me-2" flipRtl />
              {t('continueShopping')}
            </Link>
          </Button>
        )}
      </div>
    </aside>
  );
}
