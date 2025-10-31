'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui';
import { ProductCard } from '@/components/products';
import { Link } from '@/i18n/navigation';
import type { Product } from '@/types';

export interface ProductRecommendationsProps {
  products: Product[];
  categorySlug: string;
  categoryLabel: string;
  onAddToCart?: (product: Product) => Promise<void> | void;
}

export function ProductRecommendations({
  products,
  categorySlug,
  categoryLabel,
  onAddToCart,
}: ProductRecommendationsProps) {
  const t = useTranslations('calculators.recommendations');
  const handleAddToCart = onAddToCart ?? (async () => {});

  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {t('noProducts')}
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {t('title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={`/products?category=${categorySlug}`}>
            {t('viewAll', { category: categoryLabel })}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </section>
  );
}
