'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ProductCard } from '@/components/products/product-card';
import { Carousel } from './carousel';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

export interface BestSellersProps {
  products: Product[];
  onAddToCart: (product: Product) => Promise<void> | void;
  className?: string;
}

export function BestSellers({
  products,
  onAddToCart,
  className,
}: BestSellersProps) {
  const t = useTranslations('home.bestSellers');

  const hasProducts = products.length > 0;

  return (
    <section
      aria-labelledby="best-sellers-heading"
      className={cn(
        'mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8',
        className
      )}
    >
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="best-sellers-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t('title')}
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {t('subtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="self-start sm:self-auto">
          <Link href={{ pathname: '/products', query: { sort: 'bestSelling' } }}>
            {t('viewAll')}
            <Icon name="arrow-right" size="sm" className="ms-2" flipRtl />
          </Link>
        </Button>
      </div>

      {hasProducts ? (
        <Carousel
          itemsPerView={{ base: 1, sm: 1, md: 2, lg: 4 }}
          gap={24}
          showNavigation
          showDots={false}
          ariaLabel={t('title')}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </Carousel>
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

export default BestSellers;
