import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import { normalizeSupabaseProduct } from '@/lib/search/normalize';
import { getActiveFlashSalesClient } from '@/lib/marketing/flash-sales-client';
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
