'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';

import {
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
} from '@/components/ui';
import { ProductCard } from '@/components/products';
import { EmptyWishlist } from './empty-wishlist';
import { NotifyMeButton } from './notify-me-button';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { isOutOfStock } from '@/lib/utils';

const BULK_MOVE_DISABLED_THRESHOLD = 20;

export function WishlistPageContent() {
  const { items, itemCount, isLoading, moveToCart, clearWishlist } = useWishlist();
  const t = useTranslations('wishlist');
  const tActions = useTranslations('wishlist.actions');
  const tBulkActions = useTranslations('wishlist.bulkActions');
  const tAccountWishlist = useTranslations('account.wishlist');

  const [isClearing, setIsClearing] = useState(false);
  const [isMovingAll, setIsMovingAll] = useState(false);
  const [isConfirmMoveAllOpen, setIsConfirmMoveAllOpen] = useState(false);

  const hasItems = itemCount > 0;
  const isBulkMoveDisabledBySize = itemCount >= BULK_MOVE_DISABLED_THRESHOLD;

  const openMoveAllConfirmation = () => {
    if (!items.length || isBulkMoveDisabledBySize) {
      return;
    }
    setIsConfirmMoveAllOpen(true);
  };

  const handleConfirmMoveAll = async () => {
    if (!items.length) {
      setIsConfirmMoveAllOpen(false);
      return;
    }

    setIsMovingAll(true);
    try {
      const productIds = items.map((item) => item.product_id);
      await Promise.all(productIds.map((productId) => moveToCart(productId)));
    } finally {
      setIsMovingAll(false);
      setIsConfirmMoveAllOpen(false);
    }
  };

  const handleClear = async () => {
    setIsClearing(true);
    try {
      await clearWishlist();
    } finally {
      setIsClearing(false);
    }
  };

  const gridContent = useMemo(() => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`wishlist-skeleton-${index}`}
              className="h-80 animate-pulse rounded-lg border border-border bg-muted/30"
            />
          ))}
        </div>
      );
    }

    if (!hasItems) {
      return <EmptyWishlist className="mt-8" />;
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => {
          const outOfStock = isOutOfStock(item.product);
          return (
            <div key={item.id} className="flex flex-col gap-3">
              <ProductCard
                product={item.product}
                onAddToCart={async () => {
                  if (outOfStock) {
                    return;
                  }
                  await moveToCart(item.product_id);
                }}
                primaryCtaLabelKey="wishlist.actions.moveToCart"
              />
              {outOfStock && (
                <NotifyMeButton product={item.product} variant="button" size="sm" />
              )}
            </div>
          );
        })}
      </div>
    );
  }, [hasItems, isLoading, items, moveToCart]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t('pageTitle')}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {t('pageSubtitle')}
          </p>
          <p className="text-xs text-muted-foreground">
            {tAccountWishlist('itemsCount', { count: itemCount })}
          </p>
        </div>
        {hasItems && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openMoveAllConfirmation}
              disabled={isMovingAll || isClearing || isBulkMoveDisabledBySize}
              loading={isMovingAll}
              title={
                isBulkMoveDisabledBySize
                  ? tBulkActions('disabledLargeList')
                  : undefined
              }
            >
              {isMovingAll ? tActions('moveAllToCart') : tActions('moveAllToCart')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={isClearing || isMovingAll}
              loading={isClearing}
            >
              {isClearing ? tActions('clearAll') : tActions('clearAll')}
            </Button>
          </div>
        )}
      </div>

      <div className="mt-8">{gridContent}</div>

      <Modal
        open={isConfirmMoveAllOpen}
        onOpenChange={setIsConfirmMoveAllOpen}
        title={tBulkActions('confirmMoveAllTitle')}
        description={tBulkActions('confirmMoveAllDescription')}
        size="sm"
      >
        <ModalBody>
          <div className="flex items-start gap-3">
            <Icon
              name="alert-triangle"
              size="md"
              className="mt-0.5 text-destructive"
            />
            <p className="text-sm text-muted-foreground">
              {tBulkActions('confirmMoveAllDetails', { count: itemCount })}
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfirmMoveAllOpen(false)}
            disabled={isMovingAll}
          >
            {tActions('cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleConfirmMoveAll}
            loading={isMovingAll}
            disabled={isMovingAll}
          >
            {tBulkActions('confirmMoveAllCta')}
          </Button>
        </ModalFooter>
      </Modal>
    </section>
  );
}
