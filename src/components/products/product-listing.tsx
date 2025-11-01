'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { ProductListingProps, ProductFilters, SortOption } from '@/types';
import { filterProducts, sortProducts } from '@/lib/data/products';
import { DEFAULT_FILTERS } from '@/data/filter-options';
import { Button, Icon } from '@/components/ui';
import { ProductGrid } from './product-grid';
import { ProductFilters as ProductFiltersComponent } from './product-filters';
import { ProductSort } from './product-sort';
import { useCart } from '@/components/providers/CartProvider';
import { useOfflineProducts } from '@/lib/pwa/useOfflineProducts';

export function ProductListing({
  initialProducts,
  initialFilters = DEFAULT_FILTERS,
  initialSort = 'bestSelling',
  searchQuery,
  hadError = false,
}: ProductListingProps) {
  const t = useTranslations('plp');
  const tResults = useTranslations('plp.results');
  const { addItem } = useCart();
  const products = useOfflineProducts(initialProducts, {
    initialFetchFailed: hadError,
  });

  // State
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Memoized filtered and sorted products
  const displayedProducts = useMemo(() => {
    const filtered = filterProducts(products, appliedFilters);
    return sortProducts(filtered, sortBy);
  }, [products, appliedFilters, sortBy]);

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setMobileFiltersOpen(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sand-900 dark:text-sand-100 mb-2">
          {t('title')}
        </h1>
        <p className="text-sand-600 dark:text-sand-400">{t('description')}</p>
      </div>

      {/* Results Count and Sort */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Mobile Filter Button */}
          <Button
            variant="outline"
            size="md"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="lg:hidden"
          >
            <Icon name="filter" className="w-4 h-4" />
            <span>{t('filters.showFilters')}</span>
          </Button>

          {/* Results Count */}
          <p className="text-sm text-sand-600 dark:text-sand-400">
            {tResults('showing', { count: displayedProducts.length })}
          </p>
        </div>

        {/* Sort */}
        <ProductSort value={sortBy} onChange={setSortBy} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Desktop Filters - Hidden on mobile */}
        <aside className="hidden lg:block">
          <ProductFiltersComponent
            filters={filters}
            onChange={setFilters}
            onApply={handleApplyFilters}
          />
        </aside>

        {/* Mobile Filters Drawer */}
        {mobileFiltersOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileFiltersOpen(false)}>
            <div
              className="absolute inset-y-0 left-0 w-full max-w-sm bg-white dark:bg-sand-900 p-6 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-sand-900 dark:text-sand-100">
                  {t('filters.title')}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  <Icon name="x" className="w-5 h-5" />
                </Button>
              </div>
              <ProductFiltersComponent
                filters={filters}
                onChange={setFilters}
                onApply={handleApplyFilters}
              />
            </div>
          </div>
        )}

        {/* Product Grid */}
        <main>
          <ProductGrid
            products={displayedProducts}
            onAddToCart={(product) => addItem(product, 1)}
            searchQuery={searchQuery}
          />
        </main>
      </div>
    </div>
  );
}
