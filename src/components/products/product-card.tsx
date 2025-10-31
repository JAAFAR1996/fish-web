'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  Icon,
  ProductQuickView,
  StarRating,
  StockIndicator,
} from '@/components/ui';
import { FlashSaleBadge } from '@/components/marketing/flash-sale-badge';
import { Link } from '@/i18n/navigation';
import {
  cn,
  formatCompatibility,
  formatCurrency,
  formatProductSpec,
  getDiscountPercentage,
  getProductBadges,
  isLowStock,
  isOutOfStock,
} from '@/lib/utils';
import { highlightSearchTerms } from '@/lib/search/highlight-utils';
import { isFlashSaleActive } from '@/lib/marketing/flash-sales-helpers';
import type { FlashSale, Locale, Product, ProductBadge } from '@/types';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { NotifyMeButton } from '@/components/wishlist';

type BadgeVariant = 'info' | 'success' | 'destructive' | 'warning';

const BADGE_VARIANT_MAP: Record<ProductBadge, BadgeVariant> = {
  new: 'info',
  bestSeller: 'success',
  outOfStock: 'destructive',
  discount: 'warning',
};

export type ProductCardProps = {
  product: Product;
  flashSale?: FlashSale | null;
  onAddToCart: (product: Product) => Promise<void> | void;
  className?: string;
  priority?: boolean;
  primaryCtaLabelKey?: string;
  searchQuery?: string;
  averageRating?: number;
  reviewCountOverride?: number;
};

export function ProductCard({
  product,
  flashSale: flashSaleOverride,
  onAddToCart,
  className,
  priority = false,
  primaryCtaLabelKey,
  searchQuery,
  averageRating,
  reviewCountOverride,
}: ProductCardProps) {
  const locale = useLocale() as Locale;
  const tProduct = useTranslations('product');
  const tActions = useTranslations('product.actions');
  const tWishlistActions = useTranslations('wishlist.actions');
  const tBadges = useTranslations('product.badges');
  const tSpecs = useTranslations('product.specs');
  const tStock = useTranslations('product.stock');
  const tA11y = useTranslations('product.a11y');
  const tFlashSales = useTranslations('marketing.flashSales');
  const { toggleItem, isInWishlist: wishlistContains } = useWishlist();

  const flashSale = flashSaleOverride ?? product.flashSale ?? null;
  const hasFlashSale = flashSale ? isFlashSaleActive(flashSale) : false;

  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const isWishlisted = wishlistContains(product.id);
  const isWishlistPrimaryAction =
    primaryCtaLabelKey === 'wishlist.actions.moveToCart';
  const primaryCtaLabel = isWishlistPrimaryAction
    ? tWishlistActions('moveToCart')
    : tActions('addToCart');

  const currentPriceValue = hasFlashSale ? flashSale!.flash_price : product.price;
  const originalPriceValue = hasFlashSale ? flashSale!.original_price : product.originalPrice;
  const price = formatCurrency(currentPriceValue, locale);
  const originalPrice =
    originalPriceValue != null
      ? formatCurrency(originalPriceValue, locale)
      : null;
  const discountPercentage = getDiscountPercentage(
    originalPriceValue ?? null,
    currentPriceValue
  );
  const flashSaleSavings = hasFlashSale && originalPriceValue != null
    ? originalPriceValue - currentPriceValue
    : 0;
  const flashSaleSavingsText = flashSaleSavings > 0
    ? formatCurrency(flashSaleSavings, locale)
    : null;

  const compatibilityText = useMemo(() => {
    const formatted = formatCompatibility(
      product.specifications.compatibility.minTankSize,
      product.specifications.compatibility.maxTankSize,
      locale,
      {
        upTo: (value) => tSpecs('compatibilityUpTo', { value }),
        range: (min, max) => tSpecs('compatibilityRange', { min, max }),
        from: (value) => tSpecs('compatibilityFrom', { value }),
      }
    );
    return formatted || product.specifications.compatibility.displayText;
  }, [locale, product.specifications.compatibility, tSpecs]);

  const badges = useMemo(() => {
    const baseBadges = getProductBadges(product);

    if (!hasFlashSale) {
      return baseBadges;
    }

    const withFlashSale = baseBadges.includes('discount')
      ? baseBadges
      : [...baseBadges, 'discount'];

    return withFlashSale.slice(0, 2);
  }, [product, hasFlashSale]);

  const specs = useMemo(() => {
    const entries: Array<{ label: string; value: string }> = [];

    if (product.specifications.flow != null) {
      entries.push({
        label: tSpecs('flow'),
        value: formatProductSpec(
          product.specifications.flow,
          tSpecs('flowUnit'),
          locale
        ),
      });
    }

    if (product.specifications.power != null) {
      entries.push({
        label: tSpecs('power'),
        value: formatProductSpec(
          product.specifications.power,
          tSpecs('powerUnit'),
          locale
        ),
      });
    }

    if (compatibilityText) {
      entries.push({
        label: tSpecs('compatibility'),
        value: compatibilityText,
      });
    }

    return entries.slice(0, 2);
  }, [compatibilityText, locale, product.specifications, tSpecs]);

  const handleWishlistToggle = async () => {
    await toggleItem(product);
  };

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      await onAddToCart(product);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <>
      <Card
        hoverable
        className={cn('group transition-colors', className)}
      >
        <div className="relative overflow-hidden">
          <Link
            href={`/products/${product.slug}`}
            aria-label={tA11y('productImage', { productName: product.name })}
            className="block"
          >
            <div className="relative aspect-square bg-muted">
              <Image
                src={
                  product.thumbnail ||
                  product.images[0] ||
                  '/images/placeholder.png'
                }
                alt={tA11y('productImage', { productName: product.name })}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={priority}
              />
            </div>
          </Link>

          <div className="pointer-events-none absolute top-3 start-3 flex flex-col gap-1">
            {badges.map((badge) => (
              <Badge
                key={badge}
                variant={BADGE_VARIANT_MAP[badge]}
                className="pointer-events-auto w-fit"
              >
                {badge === 'discount'
                  ? tBadges('discount', { percent: discountPercentage })
                  : tBadges(badge)}
              </Badge>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`absolute top-3 end-3 z-10 rounded-full p-2 transition-colors ${
              isWishlisted
                ? 'text-coral-500 motion-safe:animate-heart-beat'
                : 'text-muted-foreground hover:text-coral-500'
            }`}
            onClick={handleWishlistToggle}
            aria-pressed={isWishlisted}
            aria-label={
              isWishlisted
                ? tProduct('actions.removeFromWishlist')
                : tProduct('actions.addToWishlist')
            }
          >
            <Icon
              name="heart"
              size="sm"
              fill={isWishlisted ? 'currentColor' : 'none'}
              strokeWidth={isWishlisted ? 0 : 1.5}
            />
          </Button>
        </div>

        <CardContent className="flex flex-1 flex-col gap-3 p-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {searchQuery
                ? highlightSearchTerms(product.brand, searchQuery)
                : product.brand}
            </span>
            <Link
              href={`/products/${product.slug}`}
              className="text-base font-semibold text-foreground transition-colors hover:text-aqua-500 line-clamp-2"
            >
              {searchQuery
                ? highlightSearchTerms(product.name, searchQuery)
                : product.name}
            </Link>
          </div>

          {searchQuery && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
              {highlightSearchTerms(product.description, searchQuery)}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {specs.map((spec) => (
              <span key={spec.label} className="flex items-center gap-1">
                <span className="font-medium text-foreground">{spec.label}:</span>
                <span>{spec.value}</span>
              </span>
            ))}
          </div>

          {/* TODO: Replace static `product.rating`/`reviewCount` with live review summary when PLP batch query lands. */}
          <StarRating
            rating={averageRating ?? product.rating}
            reviewCount={reviewCountOverride ?? product.reviewCount}
            size="sm"
          />

          {hasFlashSale && flashSale && (
            <FlashSaleBadge flashSale={flashSale} />
          )}

          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  'text-lg font-bold',
                  hasFlashSale ? 'text-destructive' : 'text-foreground'
                )}
              >
                {price}
              </span>
              {originalPrice && discountPercentage > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  {originalPrice}
                </span>
              )}
            </div>
            {hasFlashSale && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-destructive/80">
                <span className="font-semibold uppercase tracking-wide">
                  {tFlashSales('flashPrice')}
                </span>
                {flashSaleSavingsText && (
                  <span>{tFlashSales('save', { amount: flashSaleSavingsText })}</span>
                )}
              </div>
            )}
          </div>

          {isLowStock(product) && (
            <StockIndicator
              stock={product.stock}
              lowStockThreshold={product.lowStockThreshold}
            />
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 p-4 pt-0 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => setIsQuickViewOpen(true)}
            aria-label={tA11y('quickViewButton', { productName: product.name })}
          >
            <Icon name="eye" size="sm" className="me-2" />
            {tActions('quickView')}
          </Button>

          {isOutOfStock(product) ? (
            <NotifyMeButton
              product={product}
              variant="button"
              size="sm"
              className="w-full sm:w-auto"
            />
          ) : (
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              aria-label={
                isWishlistPrimaryAction
                  ? `${tWishlistActions('moveToCart')} - ${product.name}`
                  : tA11y('addToCartButton', { productName: product.name })
              }
            >
              {isAddingToCart ? (
                <Icon name="loader" size="sm" className="me-2 animate-spin" />
              ) : (
                <Icon name="cart" size="sm" className="me-2" />
              )}
              {primaryCtaLabel}
            </Button>
          )}
        </CardFooter>
      </Card>

      {isQuickViewOpen && (
        <ProductQuickView
          product={product}
          isOpen={isQuickViewOpen}
          onClose={() => setIsQuickViewOpen(false)}
          onAddToCart={onAddToCart}
        />
      )}
    </>
  );
}
