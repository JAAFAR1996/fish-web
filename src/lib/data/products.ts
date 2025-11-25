import 'server-only';

import { cache } from 'react';

import { desc } from 'drizzle-orm';

import { db } from '@server/db';
import { products as productsTable } from '@shared/schema';

import productsData from '@/data/products.json';
import { complementaryCategoryMap } from '@/lib/data/constants';
import { getActiveFlashSales } from '@/lib/marketing/flash-sales-utils';
import { normalizeSupabaseProduct } from '@/lib/search/normalize';
import type { SupabaseProductRow } from '@/lib/search/normalize';
import type { FlashSale, Product, ProductFilters, ProductWithFlashSale } from '@/types';

let productsErrorLogged = false;

function logProductsFallback(error: unknown) {
  if (productsErrorLogged) return;
  productsErrorLogged = true;
  console.warn('Failed to fetch products from database, using static fallback data', error);
}

// This module uses server-only dependencies (database access) and can only
// be imported in Server Components, Server Actions, or API Routes.
// For client-side product fetching, use @/lib/data/products-client instead.

const fetchProductsInternal = async (): Promise<{
  products: Product[];
  hadError: boolean;
}> => {
  try {
    const rows = await db
      .select()
      .from(productsTable)
      .orderBy(desc(productsTable.createdAt));

    if (rows.length === 0) {
      console.warn('No products returned from database, falling back to static data');
      const fallback = (JSON.parse(JSON.stringify(productsData)) as Product[]).map((product) =>
        Object.freeze({ ...product }),
      );
      return { products: fallback, hadError: true };
    }

    const normalized = rows.map((row) =>
      Object.freeze({
        ...normalizeSupabaseProduct(row as unknown as SupabaseProductRow),
      }),
    );

    return {
      products: normalized,
      hadError: false,
    };
  } catch (error) {
    logProductsFallback(error);
    const fallback = (JSON.parse(JSON.stringify(productsData)) as Product[]).map((product) =>
      Object.freeze({ ...product }),
    );
    return { products: fallback, hadError: true };
  }
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

function normalizeSlug(value: string): string {
  return decodeURIComponent(value).trim().toLowerCase();
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const target = normalizeSlug(slug);
  const products = await getProducts();
  return products.find((p) => normalizeSlug(p.slug) === target);
}

export { filterProducts, sortProducts } from '@/lib/data/products-shared';

export async function getUniqueBrands(products?: Product[]): Promise<string[]> {
  const allProducts = products ?? (await getProducts());
  const brands = new Set(allProducts.map((p) => p.brand));
  return Array.from(brands).sort();
}

export function getProductCountByFilter(
  products: Product[],
  filterKey: keyof ProductFilters,
  filterValue: string,
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
  limit?: number,
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

export async function getRecommendedProducts(limit: number = 8): Promise<ProductWithFlashSale[]> {
  const products = await getProductsWithFlashSales();

  const scored = products
    .map((product) => {
      const ratingScore = product.rating * 10;
      const reviewScore = Math.min(product.reviewCount ?? 0, 500) / 20;
      const bestSellerBoost = product.isBestSeller ? 15 : 0;
      const newBoost = product.isNew ? 5 : 0;

      return {
        product,
        score: ratingScore + reviewScore + bestSellerBoost + newBoost,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);

  return scored;
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
    return flashSale ? { ...product, flashSale } : { ...product };
  });
}

export async function getProductsWithFlashSales(): Promise<ProductWithFlashSale[]> {
  const [products, flashSales] = await Promise.all([getProducts(), getActiveFlashSales()]);
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
  const [products, flashSales] = await Promise.all([getProducts(), getActiveFlashSales()]);

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

  // Map legacy/static category keys to the navigation keys so the UI
  // doesn't show "0" for every category when using the JSON fallback.
  const categoryMap: Record<string, string> = {
    filtration: 'filters',
    heating: 'heaters',
    lighting: 'plantLighting',
    circulation: 'air',
    waterCare: 'waterCare',
  };

  for (const product of products) {
    const normalizedCategory = categoryMap[product.category] ?? product.category;
    counts[normalizedCategory] = (counts[normalizedCategory] ?? 0) + 1;
  }

  return counts;
}

export async function getRelatedProducts(
  product: Product,
  limit: number = 8,
): Promise<Product[]> {
  const products = await getProducts();

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id && candidate.category === product.category,
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
  limit: number = 4,
): Promise<Product[]> {
  const targetCategories =
    complementaryCategoryMap[product.category] ?? [product.category];

  const products = await getProducts();
  const tankMin = product.specifications.compatibility.minTankSize;
  const tankMax = product.specifications.compatibility.maxTankSize;

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id && targetCategories.includes(candidate.category),
    )
    .sort((a, b) => {
      const aTank = a.specifications.compatibility.minTankSize ?? 0;
      const bTank = b.specifications.compatibility.minTankSize ?? 0;
      const tankScore = tankMin && tankMax
        ? Math.abs(((aTank + bTank) / 2 || 0) - ((tankMin + tankMax) / 2 || 0))
        : 0;

      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      if (tankScore !== 0) {
        return tankScore;
      }
      return a.price - b.price;
    })
    .slice(0, limit);
}

export async function getProductsBySameSubcategory(
  product: Product,
  limit: number = 4,
): Promise<Product[]> {
  const products = await getProducts();

  return products
    .filter(
      (candidate) =>
        candidate.id !== product.id && candidate.subcategory === product.subcategory,
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
