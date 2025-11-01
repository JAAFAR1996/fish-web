import type { Locale, Product } from '@/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { normalizeSupabaseProduct } from './normalize';

export async function searchProductsSupabase(
  query: string,
  locale: Locale,
  limit?: number
): Promise<Product[]> {
  const supabase = await createServerSupabaseClient();

  const config = locale === 'ar' ? 'arabic' : 'english';
  const requestedLimit = limit ?? 50;

  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id,
        slug,
        name,
        brand,
        category,
        subcategory,
        description,
        price,
        original_price,
        currency,
        images,
        thumbnail,
        rating,
        review_count,
        stock,
        low_stock_threshold,
        in_stock,
        is_new,
        is_best_seller,
        specifications
      `
    )
    .textSearch('search_vector', query, {
      type: 'websearch',
      config,
    })
    .limit(requestedLimit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(normalizeSupabaseProduct);
}
