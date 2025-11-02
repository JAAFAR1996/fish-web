'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui';
import { CartItem } from './cart-item';
import { CartSummary } from './cart-summary';
import { FreeShippingProgress } from './free-shipping-progress';
import { UpsellSection } from './upsell-section';
import { SavedForLater } from './saved-for-later';
import { EmptyCart } from './empty-cart';
import { CalculatorLink } from './calculator-link';
import { useCart } from '@/components/providers/CartProvider';
import type { CartWithItems } from '@/types';
import { cn } from '@/lib/utils';

export type CartPageContentProps = {
  initialData?: CartWithItems | null;
  className?: string;
};

export function CartPageContent({
  initialData,
  className,
}: CartPageContentProps) {
  void initialData;
  const t = useTranslations('cart');
  const {
    items,
    savedItems,
    itemCount,
    subtotal,
    shipping,
    total,
    isLoading,
    removeItem,
    updateQuantity,
    saveForLater,
    clearCart,
  } = useCart();

  const hasItems = useMemo(() => items.length > 0, [items.length]);

  if (!isLoading && !hasItems) {
    return (
      <div
        className={cn(
          'mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8',
          className
        )}
      >
        <EmptyCart savedItemsCount={savedItems.length} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8',
        className
      )}
    >
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
            {t('yourCart')}
          </h1>
          <p className="text-sm text-muted-foreground">
            {itemCount === 1
              ? t('itemsCountSingular')
              : t('itemsCount', { count: itemCount })}
          </p>
        </div>
        {hasItems && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => clearCart()}
          >
            {t('actions.clearCart')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div>
          <FreeShippingProgress subtotal={subtotal} />
          <div className="mt-6 space-y-5">
            {isLoading
              ? Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-lg border border-border/60 bg-muted/40"
                />
              ))
              : items.map((item) => (
                <CartItem
                  key={item.product_id}
                  item={item}
                  onQuantityChange={updateQuantity}
                  onRemove={removeItem}
                  onSaveForLater={saveForLater}
                  variant="full"
                />
              ))}
          </div>
          <div className="mt-6">
            <CalculatorLink cartItems={items} variant="link" />
          </div>
          <SavedForLater className="mt-10" />
          <UpsellSection cartItems={items} className="mt-10" />
        </div>
        <CartSummary
          subtotal={subtotal}
          shipping={shipping}
          total={total}
          itemCount={itemCount}
          variant="full"
        />
      </div>
    </div>
  );
}


