import productsData from '@/data/products.json';
import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import { normalizeSupabaseProduct } from '@/lib/search/supabase-search';
import { getActiveFlashSalesClient } from '@/lib/marketing/flash-sales-client';
import type { FlashSale, Product } from '@/types';

export type ProductWithFlashSale = Product & {
  flashSale?: FlashSale;
};

async function fetchProductsClient(): Promise<Product[]> {
  try {
    const supabase = getBrowserSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('[Products Client] Failed to fetch products', error);
      const fallback = (JSON.parse(JSON.stringify(productsData)) as Product[]).map((product) =>
        Object.freeze({ ...product })
      );
      return fallback;
    }

    const products = data.map((row) => Object.freeze({ ...normalizeSupabaseProduct(row) }));
    return products;
  } catch (err) {
    console.error('[Products Client] Unexpected error', err);
    const fallback = (JSON.parse(JSON.stringify(productsData)) as Product[]).map((product) =>
      Object.freeze({ ...product })
    );
    return fallback;
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
