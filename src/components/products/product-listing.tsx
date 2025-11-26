'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { ProductListingProps, ProductFilters, SortOption } from '@/types';
import { filterProducts, sortProducts } from '@/lib/data/products-client';
import { DEFAULT_FILTERS } from '@/data/filter-options';
import { Button, Icon } from '@/components/ui';
import { ProductGrid } from './product-grid';
import { ProductFilters as ProductFiltersComponent } from './product-filters';
import { ProductSort } from './product-sort';
import { RecommendedRail } from './recommended-rail';
import { useCart } from '@/components/providers/CartProvider';
import { useOfflineProducts } from '@/lib/pwa/useOfflineProducts';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function ProductListing({
  initialProducts,
  initialFilters = DEFAULT_FILTERS,
  initialSort = 'bestSelling',
  searchQuery,
  hadError = false,
  recommendedProducts = [],
}: ProductListingProps) {
  const t = useTranslations('plp');
  const tResults = useTranslations('plp.results');
  const { addItem } = useCart();
  const products = useOfflineProducts(initialProducts, {
    initialFetchFailed: hadError,
  });
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ProductFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const priceRange = useMemo(() => {
    const prices = products.map((p) => p.price);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    return { min, max };
  }, [products]);

  // Memoized filtered and sorted products
  const displayedProducts = useMemo(() => {
    const filtered = filterProducts(products, appliedFilters);
    return sortProducts(filtered, sortBy);
  }, [products, appliedFilters, sortBy]);

  const parseFiltersFromParams = (): ProductFilters => {
    const params = searchParams;
    if (!params) {
      return { ...DEFAULT_FILTERS };
    }
    const getNumber = (key: string): number | null => {
      const value = params.get(key);
      if (!value) return null;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    const getArray = (key: string): string[] => {
      const value = params.get(key);
      return value ? value.split(',').filter(Boolean) : [];
    };

    return {
      ...DEFAULT_FILTERS,
      types: getArray('types'),
      tankSizeMin: getNumber('tankMin'),
      tankSizeMax: getNumber('tankMax'),
      flowRateMin: getNumber('flowMin'),
      flowRateMax: getNumber('flowMax'),
      priceMin: getNumber('priceMin'),
      priceMax: getNumber('priceMax'),
      ratingMin: getNumber('ratingMin'),
      brands: getArray('brands'),
      categories: getArray('categories'),
      subcategories: getArray('subcategories'),
    };
  };

  useMemo(() => {
    if (!searchParams) return;
    const nextFilters = parseFiltersFromParams();
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    const sortParam = searchParams.get('sort');
    if (sortParam && ['bestSelling', 'highestRated', 'lowestPrice', 'highestPrice', 'newest'].includes(sortParam)) {
      setSortBy(sortParam as SortOption);
    }
  }, [searchParams]);

  const updateUrl = (nextFilters: ProductFilters, nextSort: SortOption) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    const setNumber = (key: string, value: number | null) => {
      if (value === null || Number.isNaN(value)) params.delete(key);
      else params.set(key, String(value));
    };
    const setArray = (key: string, value: string[]) => {
      if (!value.length) params.delete(key);
      else params.set(key, value.join(','));
    };

    setArray('types', nextFilters.types);
    setArray('brands', nextFilters.brands);
    setArray('categories', nextFilters.categories);
    setArray('subcategories', nextFilters.subcategories);
    setNumber('tankMin', nextFilters.tankSizeMin);
    setNumber('tankMax', nextFilters.tankSizeMax);
    setNumber('flowMin', nextFilters.flowRateMin);
    setNumber('flowMax', nextFilters.flowRateMax);
    setNumber('priceMin', nextFilters.priceMin);
    setNumber('priceMax', nextFilters.priceMax);
    setNumber('ratingMin', nextFilters.ratingMin);
    params.set('sort', nextSort);
    if (searchQuery) {
      params.set('q', searchQuery);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleApplyFilters = () => {
    setAppliedFilters(filters);
    setMobileFiltersOpen(false);
    updateUrl(filters, sortBy);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    updateUrl(appliedFilters, value);
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

      {recommendedProducts.length > 0 && (
        <RecommendedRail
          products={recommendedProducts.slice(0, 8)}
          ctaHref="/products"
          className="mb-10"
        />
      )}

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
        <ProductSort value={sortBy} onChange={handleSortChange} />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Desktop Filters - Hidden on mobile */}
        <aside className="hidden lg:block">
          <ProductFiltersComponent
            filters={filters}
            onChange={setFilters}
            onApply={handleApplyFilters}
            priceRange={priceRange}
          />
        </aside>

        {/* Mobile Filters Drawer */}
        {mobileFiltersOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileFiltersOpen(false)}>
            <div
              className="absolute inset-y-0 start-0 w-full max-w-sm bg-white dark:bg-sand-900 p-6 overflow-y-auto"
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
                priceRange={priceRange}
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
