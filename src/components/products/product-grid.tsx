'use client';

import { useTranslations } from 'next-intl';
import type { Product } from '@/types';
import { ProductCard } from './product-card';

export interface ProductGridProps {
  products: Product[];
  onAddToCart?: (product: Product) => Promise<void> | void;
  searchQuery?: string;
}

export function ProductGrid({
  products,
  onAddToCart,
  searchQuery,
}: ProductGridProps) {
  const t = useTranslations('plp.results');
  const handleAddToCart = onAddToCart ?? (async () => {});

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-xl font-semibold text-sand-900 dark:text-sand-100 mb-2">
          {t('noResults')}
        </p>
        <p className="text-sm text-sand-600 dark:text-sand-400">
          {t('noResultsDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="@container">
      <div className="grid grid-cols-2 @sm:grid-cols-2 @md:grid-cols-3 @lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  );
}
