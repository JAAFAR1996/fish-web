'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
} from '@/components/ui';
import { StarRating } from '@/components/ui/star-rating';
import { StockIndicator } from '@/components/ui/stock-indicator';
import { Link } from '@/i18n/navigation';
import {
  formatCompatibility,
  formatCurrency,
  formatProductSpec,
  getDiscountPercentage,
  getProductBadges,
  isLowStock,
  isOutOfStock,
} from '@/lib/utils';
import type { Locale, Product, ProductBadge } from '@/types';

const BADGE_VARIANTS: Record<ProductBadge, 'info' | 'success' | 'destructive' | 'warning'> =
  {
    new: 'info',
    bestSeller: 'success',
    outOfStock: 'destructive',
    discount: 'warning',
  };

export type ProductQuickViewProps = {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => Promise<void> | void;
};

export function ProductQuickView({
  product,
  isOpen,
  onClose,
  onAddToCart,
}: ProductQuickViewProps) {
  const locale = useLocale() as Locale;
  const tProduct = useTranslations('product');
  const tBadges = useTranslations('product.badges');
  const tActions = useTranslations('product.actions');
  const tSpecs = useTranslations('product.specs');
  const tQuickView = useTranslations('product.quickView');
  const tStock = useTranslations('product.stock');

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

  const badges = useMemo(
    () => getProductBadges(product),
    [product]
  );

  const handleAddToCart = async () => {
    try {
      setIsAdding(true);
      await onAddToCart(product);
    } finally {
      setIsAdding(false);
    }
  };

  const availabilityText = isOutOfStock(product)
    ? tStock('outOfStock')
    : tStock('inStock');

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={product.name}
      size="lg"
      closeOnBackdrop
      closeOnEscape
    >
      {isOpen && (
        <ModalBody className="grid gap-6 p-0 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="relative min-h-[280px] w-full bg-muted">
          <Image
            src={product.thumbnail || product.images[0] || '/images/placeholder.png'}
            alt={tProduct('a11y.productImage', { productName: product.name })}
            fill
            sizes="(max-width: 768px) 90vw, 40vw"
            className="object-contain"
            priority={isOpen}
          />

          <div className="absolute top-4 start-4 flex flex-col gap-2">
            {badges.map((badge) => (
              <Badge
                key={badge}
                variant={BADGE_VARIANTS[badge]}
                className="w-fit"
              >
                {badge === 'discount'
                  ? tBadges('discount', { percent: discountPercentage })
                  : tBadges(badge)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm uppercase tracking-wide text-muted-foreground">
              {product.brand}
            </span>
            <h2 className="text-2xl font-semibold text-foreground">
              {product.name}
            </h2>
            <StarRating
              rating={product.rating}
              reviewCount={product.reviewCount}
              showValue
              size="md"
            />
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-foreground">
                {price}
              </span>
              {originalPrice && discountPercentage > 0 && (
                <span className="text-sm text-muted-foreground line-through">
                  {originalPrice}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {product.description}
          </p>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              {tQuickView('specifications')}
            </h3>
            <dl className="grid gap-2 text-sm text-muted-foreground">
              {product.specifications.flow != null && (
                <div className="flex items-center gap-2">
                  <dt className="min-w-[120px] font-medium text-foreground">
                    {tSpecs('flow')}
                  </dt>
                  <dd>
                    {formatProductSpec(
                      product.specifications.flow,
                      tSpecs('flowUnit'),
                      locale
                    )}
                  </dd>
                </div>
              )}

              {product.specifications.power != null && (
                <div className="flex items-center gap-2">
                  <dt className="min-w-[120px] font-medium text-foreground">
                    {tSpecs('power')}
                  </dt>
                  <dd>
                    {formatProductSpec(
                      product.specifications.power,
                      tSpecs('powerUnit'),
                      locale
                    )}
                  </dd>
                </div>
              )}

              {compatibilityText && (
                <div className="flex items-center gap-2">
                  <dt className="min-w-[120px] font-medium text-foreground">
                    {tSpecs('compatibility')}
                  </dt>
                  <dd>{compatibilityText}</dd>
                </div>
              )}

              <div className="flex items-center gap-2">
                <dt className="min-w-[120px] font-medium text-foreground">
                  {tQuickView('brand')}
                </dt>
                <dd>{product.brand}</dd>
              </div>

              <div className="flex items-center gap-2">
                <dt className="min-w-[120px] font-medium text-foreground">
                  {tQuickView('category')}
                </dt>
                <dd>{product.category}</dd>
              </div>

              <div className="flex items-center gap-2">
                <dt className="min-w-[120px] font-medium text-foreground">
                  {tQuickView('availability')}
                </dt>
                <dd
                  className={isOutOfStock(product)
                    ? 'text-coral-600 dark:text-coral-400'
                    : 'text-emerald-600 dark:text-emerald-400'}
                >
                  {availabilityText}
                </dd>
              </div>
            </dl>
          </div>

          {isLowStock(product) && (
            <StockIndicator
              stock={product.stock}
              lowStockThreshold={product.lowStockThreshold}
            />
          )}
          </div>
        </ModalBody>
      )}

      {isOpen && (
        <ModalFooter>
        <Button
          variant="outline"
          asChild
          className="w-full sm:w-auto"
        >
          <Link href={`/products/${product.slug}`}>
            {tActions('viewDetails')}
            <Icon
              name={locale === 'ar' ? 'arrow-left' : 'arrow-right'}
              size="sm"
              className="ms-2"
            />
          </Link>
        </Button>

        <Button
          variant="primary"
          className="w-full sm:w-auto"
          onClick={handleAddToCart}
          disabled={isOutOfStock(product) || isAdding}
        >
          {isAdding ? (
            <Icon name="loader" size="sm" className="animate-spin" />
          ) : (
            <Icon name="cart" size="sm" className="me-2" />
          )}
          {tActions('addToCart')}
        </Button>
        </ModalFooter>
      )}
    </Modal>
  );
}
