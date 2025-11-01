import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import { normalizeSupabaseProduct } from '@/lib/search/normalize';
import { getActiveFlashSalesClient } from '@/lib/marketing/flash-sales-client';
import { complementaryCategoryMap } from '@/lib/data/constants';
import type { FlashSale, Product, ProductFilters, ProductWithFlashSale, SortOption } from '@/types';

async function loadFallbackProducts(): Promise<Product[]> {
  const { default: productsData } = await import('@/data/products.json');
  return (JSON.parse(JSON.stringify(productsData)) as Product[]).map((product) =>
    Object.freeze({ ...product })
  );
}

async function fetchProductsClient(): Promise<Product[]> {
  try {
    const supabase = getBrowserSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('[Products Client] Failed to fetch products', error);
      return await loadFallbackProducts();
    }

    return data.map((row) => Object.freeze({ ...normalizeSupabaseProduct(row) }));
  } catch (err) {
    console.error('[Products Client] Unexpected error', err);
    return await loadFallbackProducts();
  }
}

function compareByRatingReviewsPrice(a: Product, b: Product): number {
  if (b.rating !== a.rating) {
    return b.rating - a.rating;
  }
  if (b.reviewCount !== a.reviewCount) {
    return b.reviewCount - a.reviewCount;
  }
  return a.price - b.price;
}

export async function getProductsWithFlashSalesClient(): Promise<ProductWithFlashSale[]> {
  const [products, flashSales] = await Promise.all([
    fetchProductsClient(),
    getActiveFlashSalesClient(),
  ]);

  const flashSaleMap = new Map<string, FlashSale>();
  flashSales.forEach((sale) => {
    flashSaleMap.set(sale.product_id, sale);
  });

  return products.map((product) => {
    const flashSale = flashSaleMap.get(product.id);
    return flashSale ? { ...product, flashSale } : { ...product };
  });
}

async function getComplementaryProductsClient(
  product: Product,
  limit: number = 4
): Promise<Product[]> {
  const targetCategories = complementaryCategoryMap[product.category] ?? [product.category];
  const products = await fetchProductsClient();

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        targetCategories.includes(candidate.category)
    )
    .sort(compareByRatingReviewsPrice)
    .slice(0, limit);
}

export { getComplementaryProductsClient as getComplementaryProducts };

async function getRelatedProductsClient(
  product: Product,
  limit: number = 8
): Promise<Product[]> {
  const products = await fetchProductsClient();

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id && candidate.category === product.category
    )
    .sort((a, b) => {
      if (a.subcategory !== b.subcategory) {
        if (a.subcategory === product.subcategory) return -1;
        if (b.subcategory === product.subcategory) return 1;
      }
      return compareByRatingReviewsPrice(a, b);
    })
    .slice(0, limit);
}

export { getRelatedProductsClient as getRelatedProducts };

async function getProductsBySameSubcategoryClient(
  product: Product,
  limit: number = 4
): Promise<Product[]> {
  const products = await fetchProductsClient();

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.subcategory === product.subcategory
    )
    .sort(compareByRatingReviewsPrice)
    .slice(0, limit);
}

export { getProductsBySameSubcategoryClient as getProductsBySameSubcategory };

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
