'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Icon,
  StarRating,
  StockIndicator,
} from '@/components/ui';
import { ARViewer } from '@/components/products/ARViewer';
import { ProductTransparency } from '@/components/products/ProductTransparency';
import { NotifyMeButton } from '@/components/wishlist';
import { ShareButtons } from '@/components/pdp/share-buttons';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import {
  formatCurrency,
  formatProductSpec,
  getDiscountPercentage,
  getProductBadges,
  getWhatsAppUrl,
  isLowStock,
  isOutOfStock,
} from '@/lib/utils';
import { RETURN_POLICY_WINDOW_DAYS } from '@/lib/config/contact';
import { FEATURES } from '@/lib/config/features';
import type { Locale, Product, ProductBadge } from '@/types';

const BADGE_VARIANT_MAP: Record<
  ProductBadge,
  'info' | 'success' | 'destructive' | 'warning'
> = {
  new: 'info',
  bestSeller: 'success',
  outOfStock: 'destructive',
  discount: 'warning',
};

export interface ProductInfoProps {
  product: Product;
  averageRating?: number;
  reviewCount?: number;
}

export function ProductInfo({ product, averageRating, reviewCount }: ProductInfoProps) {
  const locale = useLocale() as Locale;
  const tPdp = useTranslations('pdp');
  const tBadges = useTranslations('product.badges');
  const tRating = useTranslations('product.rating');
  const tStock = useTranslations('product.stock');
  const tActions = useTranslations('wishlist.actions');

  const { addItem } = useCart();
  const { toggleItem, isInWishlist } = useWishlist();

  const [isAdding, setIsAdding] = useState(false);

  const price = formatCurrency(product.price, locale);
  const originalPrice =
    product.originalPrice != null
      ? formatCurrency(product.originalPrice, locale)
      : null;

  const discountPercentage = getDiscountPercentage(
    product.originalPrice,
    product.price
  );

  const badges = getProductBadges(product);
  const outOfStock = isOutOfStock(product);
  const lowStock = isLowStock(product);
  const isWishlisted = isInWishlist(product.id);

  const compatibilityText =
    product.specifications.compatibility.displayText ||
    (() => {
      const { minTankSize, maxTankSize } = product.specifications.compatibility;
      if (minTankSize && maxTankSize) {
        return tPdp('specs.tankSizeValue', {
          min: formatProductSpec(minTankSize, 'L', locale),
          max: formatProductSpec(maxTankSize, 'L', locale),
        });
      }
      if (minTankSize) {
        return tPdp('specs.tankSizeMin', {
          min: formatProductSpec(minTankSize, 'L', locale),
        });
      }
      if (maxTankSize) {
        return tPdp('specs.tankSizeMax', {
          max: formatProductSpec(maxTankSize, 'L', locale),
        });
      }
      return '';
    })();

  const whatsAppUrl = getWhatsAppUrl(
    product,
    locale,
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP
  );

  const handleAddToCart = async () => {
    if (outOfStock) {
      return;
    }

    try {
      setIsAdding(true);
      await addItem(product, 1);
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = async () => {
    await toggleItem(product);
  };

  const codReturnLine =
    locale === 'ar'
      ? `الدفع عند الاستلام • إرجاع خلال ${RETURN_POLICY_WINDOW_DAYS} أيام`
      : `Cash on delivery • Returns within ${RETURN_POLICY_WINDOW_DAYS} days`;
  const trustMessage =
    locale === 'ar'
      ? `ستدفع نقداً عند الاستلام – لا توجد أي دفعة الآن. إرجاع خلال ${RETURN_POLICY_WINDOW_DAYS} أيام.`
      : `You’ll pay cash on delivery — nothing now. Returns within ${RETURN_POLICY_WINDOW_DAYS} days.`;

  return (
    <section className="space-y-6 pb-32 lg:space-y-8 lg:pb-0">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {badges.map((badge) => {
              const label =
                badge === 'discount'
                  ? tBadges('discount', { percent: discountPercentage })
                  : tBadges(badge);
              return (
                <Badge
                  key={badge}
                  variant={BADGE_VARIANT_MAP[badge] ?? 'info'}
                >
                  {label}
                </Badge>
              );
            })}
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {product.name}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <StarRating rating={averageRating ?? product.rating} reviewCount={reviewCount ?? product.reviewCount} />
          <span>{tRating('reviews', { count: reviewCount ?? product.reviewCount })}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold text-foreground">
            {price}
          </span>
          {originalPrice && discountPercentage > 0 && (
            <span className="text-lg text-muted-foreground line-through">
              {originalPrice}
            </span>
          )}
          {discountPercentage > 0 && (
            <Badge variant="warning" size="sm">
              -{discountPercentage}%
            </Badge>
          )}
        </div>
        {outOfStock ? (
          <Badge variant="destructive" size="sm" className="w-fit">
            {tStock('outOfStock')}
          </Badge>
        ) : lowStock ? (
          <StockIndicator
            stock={product.stock}
            lowStockThreshold={product.lowStockThreshold}
          />
        ) : null}
      </div>

      <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
        <p>{product.description}</p>
        {compatibilityText && (
          <p className="text-sm text-muted-foreground">{compatibilityText}</p>
        )}
      </div>

      <div className="hidden gap-3 sm:grid sm:grid-cols-2">
        {outOfStock ? (
          <NotifyMeButton product={product} variant="button" size="lg" />
        ) : (
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleAddToCart}
            loading={isAdding}
          >
            <Icon name="cart" size="sm" />
            {tPdp('cta.addToCart')}
          </Button>
        )}
        <Button type="button" variant="secondary" size="lg" className="w-full" disabled>
          <Icon name="credit-card" size="sm" />
          {tPdp('cta.buyNow')}
        </Button>
        <Button
          type="button"
          variant={isWishlisted ? 'primary' : 'outline'}
          size="lg"
          className="w-full"
          onClick={handleWishlistToggle}
        >
          <Icon name="heart" size="sm" className={isWishlisted ? 'text-white' : undefined} />
          {isWishlisted ? tActions('removeFromWishlist') : tPdp('cta.addToWishlist')}
        </Button>
        {whatsAppUrl && (
          <Button type="button" variant="outline" size="lg" className="w-full" asChild>
            <a href={whatsAppUrl} target="_blank" rel="noreferrer">
              <Icon name="whatsapp" size="sm" />
              {tPdp('cta.contactWhatsApp')}
            </a>
          </Button>
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-border/70 bg-muted/40 p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
          <StarRating rating={averageRating ?? product.rating} reviewCount={reviewCount ?? product.reviewCount} />
          <span className="text-muted-foreground">
            {tRating('reviews', { count: reviewCount ?? product.reviewCount })}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-foreground">
          <Icon name="shield-check" className="h-4 w-4 text-aqua-600" aria-hidden />
          <span>{codReturnLine}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Icon name="credit-card" className="h-4 w-4" aria-hidden />
          <span>{trustMessage}</span>
        </div>
      </div>

      {product.category.toLowerCase().includes('tank') && product.images?.[0] && (
        FEATURES.arViewer ? (
          <ARViewer modelUrl={product.images[0]} className="w-full" />
        ) : (
          <div className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
            AR preview coming soon for this model.
          </div>
        )
      )}

      <ProductTransparency product={product} />

      <ShareButtons
        product={product}
        locale={locale}
        phoneNumber={process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP}
      />

      <div className="fixed inset-x-0 bottom-20 z-40 border-t border-border/80 bg-background/95 px-4 py-3 shadow-lg backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          {outOfStock ? (
            <NotifyMeButton product={product} variant="button" size="lg" className="flex-1" />
          ) : (
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              loading={isAdding}
            >
              <Icon name="cart" size="sm" />
              {tPdp('cta.addToCart')}
            </Button>
          )}
          <Button
            type="button"
            variant={isWishlisted ? 'secondary' : 'outline'}
            size="lg"
            className="w-[48px] min-w-[48px] flex-none rounded-xl p-0"
            aria-pressed={isWishlisted}
            onClick={handleWishlistToggle}
          >
            <Icon name="heart" size="md" className={isWishlisted ? 'text-aqua-600' : undefined} />
          </Button>
        </div>
      </div>
    </section>
  );
}
