'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { CartItem } from './cart-item';
import { useCart } from '@/components/providers/CartProvider';
import { cn } from '@/lib/utils';

export type SavedForLaterProps = {
  className?: string;
};

export function SavedForLater({ className }: SavedForLaterProps) {
  const { savedItems, moveToCart, removeSavedItem } = useCart();
  const t = useTranslations('cart.savedForLater');

  const hasSavedItems = useMemo(
    () => savedItems.length > 0,
    [savedItems.length]
  );

  if (!hasSavedItems) {
    return null;
  }

  return (
    <section
      id="saved-items"
      className={cn(
        'mt-10 rounded-lg border border-border/60 bg-card/60 p-6',
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t('title')}
        </h2>
        <span className="text-sm text-muted-foreground">
          {savedItems.length}
        </span>
      </div>
      <div className="space-y-4">
        {savedItems.map((item) => (
          <CartItem
            key={item.product_id}
            item={item}
            onQuantityChange={async () => undefined}
            onRemove={removeSavedItem}
            onSaveForLater={moveToCart}
            variant="full"
            mode="saved"
          />
        ))}
      </div>
    </section>
  );
}
