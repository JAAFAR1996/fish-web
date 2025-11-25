import type { Product, ProductFilters, SortOption } from '@/types';

export function filterProducts(
  products: Product[],
  filters: ProductFilters
): Product[] {
  let filtered = [...products];

  // Filter by types (subcategory)
  if (filters.types.length > 0) {
    filtered = filtered.filter((p) => filters.types.includes(p.subcategory));
  }

  // Filter by tank size
  if (filters.tankSizeMin !== null || filters.tankSizeMax !== null) {
    filtered = filtered.filter((p) => {
      const { minTankSize, maxTankSize } = p.specifications.compatibility;
      
      // Check if product's range overlaps with filter range
      if (filters.tankSizeMin !== null) {
        // Product must support at least tankSizeMin
        if (maxTankSize !== null && maxTankSize < filters.tankSizeMin) {
          return false;
        }
      }
      
      if (filters.tankSizeMax !== null) {
        // Product must support at most tankSizeMax
        if (minTankSize !== null && minTankSize > filters.tankSizeMax) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Filter by flow rate
  if (filters.flowRateMin !== null || filters.flowRateMax !== null) {
    filtered = filtered.filter((p) => {
      const flow = p.specifications.flow;
      if (flow === null) return false;
      
      if (filters.flowRateMin !== null && flow < filters.flowRateMin) {
        return false;
      }
      
      if (filters.flowRateMax !== null && flow > filters.flowRateMax) {
        return false;
      }
      
      return true;
    });
  }

  // Filter by price
  if (filters.priceMin !== null || filters.priceMax !== null) {
    filtered = filtered.filter((p) => {
      if (filters.priceMin !== null && p.price < filters.priceMin) {
        return false;
      }
      if (filters.priceMax !== null && p.price > filters.priceMax) {
        return false;
      }
      return true;
    });
  }

  // Filter by rating
  const ratingMin = filters.ratingMin;
  if (ratingMin !== null) {
    filtered = filtered.filter((p) => p.rating >= ratingMin);
  }

  // Filter by brands
  if (filters.brands.length > 0) {
    filtered = filtered.filter((p) => filters.brands.includes(p.brand));
  }

  // Filter by categories
  if (filters.categories.length > 0) {
    filtered = filtered.filter((p) => filters.categories.includes(p.category));
  }

  // Filter by subcategories
  if (filters.subcategories.length > 0) {
    filtered = filtered.filter((p) => filters.subcategories.includes(p.subcategory));
  }

  return filtered;
}

export function sortProducts(products: Product[], sortBy: SortOption): Product[] {
  const sorted = [...products];

  switch (sortBy) {
    case 'bestSelling':
      return sorted.sort((a, b) => {
        // Best sellers first, then by review count
        if (a.isBestSeller !== b.isBestSeller) {
          return a.isBestSeller ? -1 : 1;
        }
        return b.reviewCount - a.reviewCount;
      });

    case 'highestRated':
      return sorted.sort((a, b) => {
        // Sort by rating, then by review count for ties
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.reviewCount - a.reviewCount;
      });

    case 'lowestPrice':
      return sorted.sort((a, b) => a.price - b.price);

    case 'newest':
      return sorted.sort((a, b) => {
        // New products first, then by ID (assuming higher ID = newer)
        if (a.isNew !== b.isNew) {
          return a.isNew ? -1 : 1;
        }
        const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return createdB - createdA;
      });

    default:
      return sorted;
  }
}
