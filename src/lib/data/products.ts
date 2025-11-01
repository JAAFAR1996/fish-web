import { cache } from 'react';

import productsData from '@/data/products.json';
import { getActiveFlashSales } from '@/lib/marketing/flash-sales-utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeSupabaseProduct } from '@/lib/search/normalize';
import type { FlashSale, Product, ProductFilters, ProductWithFlashSale, SortOption } from '@/types';

const fetchProductsInternal = async (): Promise<{
  products: Product[];
  hadError: boolean;
}> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Failed to fetch products', error);
    const fallback = (JSON.parse(JSON.stringify(productsData)) as Product[]).map((product) =>
      Object.freeze({ ...product })
    );
    return { products: fallback, hadError: true };
  }

  const products = data.map((row) => Object.freeze({ ...normalizeSupabaseProduct(row) }));

  return {
    products,
    hadError: false,
  };
};

const cachedFetchProducts = cache(fetchProductsInternal);

export const getProducts = cache(async (): Promise<Product[]> => {
  const { products } = await cachedFetchProducts();
  return products;
});

export async function getProductsWithStatus(): Promise<{
  products: Product[];
  hadError: boolean;
}> {
  return cachedFetchProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

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

export async function getUniqueBrands(products?: Product[]): Promise<string[]> {
  const allProducts = products ?? (await getProducts());
  const brands = new Set(allProducts.map((p) => p.brand));
  return Array.from(brands).sort();
}

export function getProductCountByFilter(
  products: Product[],
  filterKey: keyof ProductFilters,
  filterValue: string
): number {
  switch (filterKey) {
    case 'types':
      return products.filter((p) => p.subcategory === filterValue).length;
    case 'brands':
      return products.filter((p) => p.brand === filterValue).length;
    case 'categories':
      return products.filter((p) => p.category === filterValue).length;
    case 'subcategories':
      return products.filter((p) => p.subcategory === filterValue).length;
    default:
      return 0;
  }
}

export async function getBestSellers(limit: number = 8): Promise<ProductWithFlashSale[]> {
  const products = await getProductsWithFlashSales();
  const bestSellers = products.filter((product) => product.isBestSeller);

  return bestSellers
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return a.price - b.price;
    })
    .slice(0, limit);
}

export async function getNewArrivals(limit: number = 8): Promise<ProductWithFlashSale[]> {
  const products = await getProductsWithFlashSales();
  const newArrivals = products.filter((product) => product.isNew);

  return newArrivals
    .sort((a, b) => {
      const createdA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const createdB = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (createdB !== createdA) {
        return createdB - createdA;
      }
      return b.rating - a.rating;
    })
    .slice(0, limit);
}

export async function getProductsByCategory(
  category: string,
  limit?: number
): Promise<ProductWithFlashSale[]> {
  const products = await getProductsWithFlashSales();
  const filtered = products.filter((product) => product.category === category);

  const sorted = filtered.sort((a, b) => {
    if (b.rating !== a.rating) {
      return b.rating - a.rating;
    }
    return b.reviewCount - a.reviewCount;
  });

  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}

function attachFlashSalesToProducts(
  products: Product[],
  flashSales: FlashSale[],
): ProductWithFlashSale[] {
  const flashSaleMap = new Map<string, FlashSale>();
  flashSales.forEach((sale) => {
    flashSaleMap.set(sale.product_id, sale);
  });

  return products.map((product) => {
    const flashSale = flashSaleMap.get(product.id);
    return flashSale
      ? { ...product, flashSale }
      : { ...product };
  });
}

export async function getProductsWithFlashSales(): Promise<ProductWithFlashSale[]> {
  const [products, flashSales] = await Promise.all([
    getProducts(),
    getActiveFlashSales(),
  ]);
  return attachFlashSalesToProducts(products, flashSales);
}

export async function getProductsWithFlashSalesStatus(): Promise<{
  products: ProductWithFlashSale[];
  hadError: boolean;
}> {
  const [result, flashSales] = await Promise.all([
    getProductsWithStatus(),
    getActiveFlashSales(),
  ]);
  return {
    products: attachFlashSalesToProducts(result.products, flashSales),
    hadError: result.hadError,
  };
}

export async function getFlashSaleProducts(): Promise<ProductWithFlashSale[]> {
  const [products, flashSales] = await Promise.all([
    getProducts(),
    getActiveFlashSales(),
  ]);

  const productMap = new Map(products.map((product) => [product.id, product]));

  return flashSales
    .map((sale) => {
      const product = productMap.get(sale.product_id);
      if (!product) {
        return null;
      }
      return {
        ...product,
        flashSale: sale,
      } as ProductWithFlashSale;
    })
    .filter((entry): entry is ProductWithFlashSale => entry !== null)
    .sort((a, b) => {
      const endA = new Date(a.flashSale!.ends_at).getTime();
      const endB = new Date(b.flashSale!.ends_at).getTime();
      return endA - endB;
    });
}

export async function getCategoryProductCount(category: string): Promise<number> {
  const products = await getProductsByCategory(category);
  return products.length;
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  const products = await getProducts();
  const counts: Record<string, number> = {};

  for (const product of products) {
    counts[product.category] = (counts[product.category] ?? 0) + 1;
  }

  return counts;
}

export async function getRelatedProducts(
  product: Product,
  limit: number = 8
): Promise<Product[]> {
  const products = await getProducts();

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

      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }

      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }

      return a.price - b.price;
    })
    .slice(0, limit);
}

export async function getComplementaryProducts(
  product: Product,
  limit: number = 4
): Promise<Product[]> {
  const complementaryMap: Record<string, string[]> = {
    filtration: ['heating', 'waterCare'],
    heating: ['filtration', 'waterCare'],
    lighting: ['plantsFertilizers', 'waterCare'],
    waterCare: ['filtration', 'tests'],
    plantsFertilizers: ['lighting', 'waterCare'],
  };

  const targetCategories =
    complementaryMap[product.category] ?? [product.category];

  const products = await getProducts();

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        targetCategories.includes(candidate.category)
    )
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return a.price - b.price;
    })
    .slice(0, limit);
}

export async function getProductsBySameSubcategory(
  product: Product,
  limit: number = 4
): Promise<Product[]> {
  const products = await getProducts();

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id &&
        candidate.subcategory === product.subcategory
    )
    .sort((a, b) => {
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return a.price - b.price;
    })
    .slice(0, limit);
}
