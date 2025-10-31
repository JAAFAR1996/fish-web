'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { ProductCard } from '@/components/products';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export interface RelatedProductsProps {
  products: Product[];
  category: string;
  title?: string;
  onAddToCart: (product: Product) => Promise<void> | void;
  className?: string;
  maxProducts?: number;
}

export function RelatedProducts({
  products,
  category,
  title,
  onAddToCart,
  className,
  maxProducts = 8,
}: RelatedProductsProps) {
  const t = useTranslations('pdp.related');

  const visibleProducts = useMemo(
    () => products.slice(0, maxProducts),
    [maxProducts, products]
  );

  if (!visibleProducts.length) {
    return null;
  }

  return (
    <section className={cn('space-y-6', className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-semibold text-foreground">
            {title ?? t('title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start sm:self-auto"
          asChild
        >
          <Link href={`/products?category=${category}`}>
            {t('viewAll')}
            <Icon name="arrow-right" size="sm" className="ms-2" flipRtl />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
}
