'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import type { Locale } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';

export interface OrderSummaryCheckoutProps {
  subtotal: number;
  shipping: number;
  discount: number;
  loyaltyDiscount?: number;
  total: number;
  itemCount: number;
  className?: string;
}

export function OrderSummaryCheckout({
  subtotal,
  shipping,
  discount,
  loyaltyDiscount = 0,
  total,
  itemCount,
  className,
}: OrderSummaryCheckoutProps) {
  const locale = useLocale();
  const resolvedLocale: Locale = locale === 'ar' ? 'ar' : 'en';
  const tReview = useTranslations('checkout.review');
  const tSummary = useTranslations('checkout.summary');
  const tShippingCost = useTranslations('checkout.shippingCost');

  const summaryItems = useMemo(
    () => {
      const items: Array<{ label: string; value: string }> = [
        {
          label: tSummary('subtotal', { count: itemCount }),
          value: formatCurrency(subtotal, resolvedLocale),
        },
        {
          label: tSummary('shipping'),
          value:
            shipping === 0
              ? tShippingCost('free')
              : formatCurrency(shipping, resolvedLocale),
        },
      ];

      if (discount > 0) {
        items.push({
          label: tSummary('discount'),
          value: `- ${formatCurrency(discount, resolvedLocale)}`,
        });
      }

      if (loyaltyDiscount > 0) {
        items.push({
          label: tSummary('loyaltyDiscount'),
          value: `- ${formatCurrency(loyaltyDiscount, resolvedLocale)}`,
        });
      }

      return items;
    },
    [discount, itemCount, loyaltyDiscount, resolvedLocale, shipping, subtotal, tShippingCost, tSummary]
  );

  return (
    <aside
      className={cn(
        'rounded-lg border border-border bg-background p-6 shadow-sm',
        className
      )}
    >
      <h3 className="text-lg font-semibold text-foreground">
        {tReview('orderSummary')}
      </h3>

      <div className="mt-4 space-y-3">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium text-foreground">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between text-base font-semibold">
          <span>{tSummary('total')}</span>
          <span>{formatCurrency(total, resolvedLocale)}</span>
        </div>
      </div>
    </aside>
  );
}
