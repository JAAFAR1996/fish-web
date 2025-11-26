'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Icon,
} from '@/components/ui';
import { Link } from '@/i18n/navigation';
import {
  formatCurrency,
  isLowStock,
  isOutOfStock,
} from '@/lib/utils';
import type { CartItemWithProduct, Locale } from '@/types';
import { cn } from '@/lib/utils';
import { QuantitySelector } from './quantity-selector';

export type CartItemProps = {
  item: CartItemWithProduct;
  onQuantityChange: (productId: string, quantity: number) => Promise<void> | void;
  onRemove: (productId: string) => Promise<void> | void;
  onSaveForLater: (productId: string) => Promise<void> | void;
  variant?: 'sidebar' | 'full';
  mode?: 'cart' | 'saved';
  className?: string;
};

export function CartItem({
  item,
  onQuantityChange,
  onRemove,
  onSaveForLater,
  variant = 'full',
  mode = 'cart',
  className,
}: CartItemProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations('cart.item');
  const tSaved = useTranslations('cart.savedForLater');
  const [removing, setRemoving] = useState(false);
  const [primaryLoading, setPrimaryLoading] = useState(false);

  const product = item.product;
  const outOfStock = isOutOfStock(product);
  const lowStock = isLowStock(product);
  const isSaved = mode === 'saved';

  const handleRemove = async () => {
    setRemoving(true);
    try {
      await onRemove(item.product_id);
    } finally {
      setRemoving(false);
    }
  };

  const handlePrimaryAction = async () => {
    setPrimaryLoading(true);
    try {
      await onSaveForLater(item.product_id);
    } finally {
      setPrimaryLoading(false);
    }
  };

  const lineTotal = product.price * item.quantity;
  const formattedUnitPrice = formatCurrency(product.price, locale);
  const formattedLineTotal = formatCurrency(lineTotal, locale);

  if (variant === 'sidebar') {
    return (
      <div
        className={cn(
          'flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3 transition-colors',
          className
        )}
      >
        <Link
          href={`/products/${product.slug}`}
          className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted"
        >
          <Image
            src={product.thumbnail || product.images[0]}
            alt={product.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </Link>
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/products/${product.slug}`}
                className="line-clamp-2 text-sm font-medium text-foreground hover:text-aqua-500"
              >
                {product.name}
              </Link>
              <div className="mt-1 text-xs text-muted-foreground">
                {product.brand}
              </div>
              {(outOfStock || lowStock) && (
                <Badge
                  variant={outOfStock ? 'destructive' : 'warning'}
                  size="sm"
                  className="mt-2"
                >
                  {outOfStock
                    ? t('outOfStock')
                    : t('lowStock', { count: product.stock })}
                </Badge>
              )}
            </div>
            <div className="text-end text-sm font-semibold text-foreground">
              {formattedLineTotal}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            {!isSaved ? (
              <QuantitySelector
                value={item.quantity}
                onChange={(quantity) => onQuantityChange(item.product_id, quantity)}
                stock={product.stock}
                disabled={outOfStock}
                size="sm"
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                {t('quantity')}
                :
                {' '}
                {item.quantity}
              </span>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handlePrimaryAction}
                disabled={primaryLoading}
                aria-label={isSaved ? tSaved('moveToCart') : t('saveForLater')}
              >
                {primaryLoading ? (
                  <Icon name="loader" size="sm" className="animate-spin" />
                ) : (
                  <Icon name={isSaved ? 'cart' : 'bookmark'} size="sm" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleRemove}
                disabled={removing}
                aria-label={t('remove')}
              >
                {removing ? (
                  <Icon name="loader" size="sm" className="animate-spin" />
                ) : (
                  <Icon name="trash" size="sm" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-lg border border-border/60 bg-card p-5 transition-colors lg:flex-row lg:items-center lg:gap-6',
        className
      )}
    >
      <Link
        href={`/products/${product.slug}`}
        className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-md bg-muted sm:h-32 sm:w-32"
      >
        <Image
          src={product.thumbnail || product.images[0]}
          alt={product.name}
          fill
          sizes="128px"
          className="object-cover"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3">
        <div className="min-w-0">
          <div className="text-sm uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </div>
          <Link
            href={`/products/${product.slug}`}
            className="mt-1 line-clamp-2 text-lg font-semibold text-foreground hover:text-aqua-500"
          >
            {product.name}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {product.specifications.flow != null && (
              <span>
                {product.specifications.flow}
                {' '}
                L/h
              </span>
            )}
            {product.specifications.power != null && (
              <span>
                {product.specifications.power}
                {' '}
                W
              </span>
            )}
            {product.specifications.compatibility.displayText && (
              <span>{product.specifications.compatibility.displayText}</span>
            )}
          </div>
          {(outOfStock || lowStock) && (
            <Badge
              variant={outOfStock ? 'destructive' : 'warning'}
              className="mt-3 w-fit"
            >
              {outOfStock
                ? t('outOfStock')
                : t('lowStock', { count: product.stock })}
            </Badge>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {!isSaved ? (
            <div className="flex items-center gap-3">
              <QuantitySelector
                value={item.quantity}
                onChange={(quantity) => onQuantityChange(item.product_id, quantity)}
                stock={product.stock}
                disabled={outOfStock}
                size="md"
              />
              <div className="text-sm text-muted-foreground">
                {formattedUnitPrice}
                {' '}
                ×
                {' '}
                {item.quantity}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {t('quantity')}
              :
              {' '}
              {item.quantity}
              {' • '}
              {formattedUnitPrice}
            </div>
          )}
          <div className="text-lg font-semibold text-foreground">
            {formattedLineTotal}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrimaryAction}
            disabled={primaryLoading}
          >
            {primaryLoading ? (
              <Icon name="loader" size="sm" className="me-2 animate-spin" />
            ) : (
              <Icon
                name={isSaved ? 'cart' : 'bookmark'}
                size="sm"
                className="me-2"
              />
            )}
            {isSaved ? tSaved('moveToCart') : t('saveForLater')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={removing}
          >
            {removing ? (
              <Icon name="loader" size="sm" className="me-2 animate-spin" />
            ) : (
              <Icon name="trash" size="sm" className="me-2" />
            )}
            {isSaved ? tSaved('remove') : t('remove')}
          </Button>
        </div>
      </div>
    </div>
  );
}
