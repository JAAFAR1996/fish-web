'use client';

import type { AuthUser } from '@server/auth';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui';
import { ProductCard } from '@/components/products';
import { EmptyWishlist } from '@/components/wishlist';
import { Link } from '@/i18n/navigation';
import { useWishlist } from '@/components/providers/WishlistProvider';

interface WishlistSectionProps {
  user: AuthUser;
}

export function WishlistSection(_props: WishlistSectionProps) {
  const t = useTranslations('account.wishlist');
  const tWishlist = useTranslations('wishlist.actions');
  const { items, isLoading, moveToCart } = useWishlist();

  const previewItems = useMemo(() => items.slice(0, 4), [items]);

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">{t('title')}</h3>
          <Button asChild variant="ghost" size="sm">
            <Link href="/wishlist">{tWishlist('continueShopping')}</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`wishlist-preview-skeleton-${index}`}
              className="h-64 animate-pulse rounded-lg border border-border bg-muted/30"
            />
          ))}
        </div>
      </section>
    );
  }

  if (previewItems.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">{t('title')}</h3>
          <Button asChild variant="ghost" size="sm">
            <Link href="/products">{t('addItems')}</Link>
          </Button>
        </div>
        <EmptyWishlist className="border border-dashed border-border/60 bg-muted/20" />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">{t('title')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('itemsCount', { count: items.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/wishlist">{tWishlist('continueShopping')}</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/products">{t('addItems')}</Link>
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {previewItems.map((item) => (
          <ProductCard
            key={item.id}
            product={item.product}
            onAddToCart={async () => moveToCart(item.product_id)}
          />
        ))}
      </div>
      {items.length > previewItems.length && (
        <div className="text-end">
          <Button asChild variant="ghost" size="sm">
            <Link href="/wishlist">{tWishlist('continueShopping')}</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
