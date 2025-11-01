import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import { normalizeSupabaseProduct } from '@/lib/search/normalize';
import { getActiveFlashSalesClient } from '@/lib/marketing/flash-sales-client';
import { complementaryCategoryMap } from '@/lib/data/constants';
import type { FlashSale, Product, ProductWithFlashSale } from '@/types';

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

export { filterProducts, sortProducts } from '@/lib/data/products-shared';
