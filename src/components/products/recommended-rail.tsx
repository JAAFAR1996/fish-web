'use client';

import { useTranslations } from 'next-intl';

import type { Product } from '@/types';
import { ProductCard } from '@/components/products/product-card';
import { Carousel } from '@/components/home/carousel';
import { Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';

export interface RecommendedRailProps {
  products: Product[];
  ctaHref?: string;
  className?: string;
  onAddToCart?: (product: Product) => Promise<void> | void;
}

export function RecommendedRail({
  products,
  ctaHref = '/products',
  className,
  onAddToCart,
}: RecommendedRailProps) {
  const t = useTranslations('home.recommended');
  const handleAdd = onAddToCart ?? (() => {});

  if (!products.length) {
    return null;
  }

  return (
    <section className={className}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={ctaHref}>
            {t('viewAll')}
            <Icon name="arrow-right" className="ms-2 h-4 w-4" flipRtl />
          </Link>
        </Button>
      </div>
      <Carousel itemsPerView={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={20} showDots={false}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onAddToCart={handleAdd} />
        ))}
      </Carousel>
    </section>
  );
}
