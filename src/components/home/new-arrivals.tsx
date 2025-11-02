'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ProductCard } from '@/components/products/product-card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export interface NewArrivalsProps {
  products: Product[];
  onAddToCart: (product: Product) => Promise<void> | void;
  className?: string;
  maxProducts?: number;
}

export function NewArrivals({
  products,
  onAddToCart,
  className,
  maxProducts = 8,
}: NewArrivalsProps) {
  const t = useTranslations('home.newArrivals');

  const visibleProducts = products.slice(0, maxProducts);
  const hasProducts = visibleProducts.length > 0;

  return (
    <section
      aria-labelledby="new-arrivals-heading"
      className={cn(
        'mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8',
        className
      )}
    >
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="new-arrivals-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t('title')}
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {t('subtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="self-start sm:self-auto">
          <Link href={{ pathname: '/products', query: { sort: 'newest' } }}>
            {t('viewAll')}
            <Icon name="arrow-right" size="sm" className="ms-2" flipRtl />
          </Link>
        </Button>
      </div>

      {hasProducts ? (
        <div className="@container grid grid-cols-2 gap-4 sm:gap-6 @md:grid-cols-3 @lg:grid-cols-4">
          {visibleProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-muted-foreground/30 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      )}
    </section>
  );
}

export default NewArrivals;
