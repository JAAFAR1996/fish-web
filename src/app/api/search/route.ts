import { NextResponse } from 'next/server';

import type { AutocompleteSuggestion, Locale, Product } from '@/types';
import {
  formatBrandSuggestion,
  formatCategorySuggestion,
  formatProductSuggestion,
  getAutocompleteSuggestions,
} from '@/lib/search/autocomplete-utils';
import {
  MAX_BRAND_SUGGESTIONS,
  MAX_CATEGORY_SUGGESTIONS,
  MAX_PRODUCT_SUGGESTIONS,
  MIN_SEARCH_LENGTH,
} from '@/lib/search/constants';
import { searchProductsSupabase } from '@/lib/search/supabase-search';

function buildSuggestionsFromProducts(
  products: Product[]
): AutocompleteSuggestion[] {
  const productSuggestions = products
    .slice(0, MAX_PRODUCT_SUGGESTIONS)
    .map((product) => formatProductSuggestion(product));

  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();

  products.forEach((product) => {
    if (product.brand) {
      brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1);
    }
    if (product.category) {
      categoryCounts.set(
        product.category,
        (categoryCounts.get(product.category) ?? 0) + 1
      );
    }
  });

  const brandSuggestions = Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_BRAND_SUGGESTIONS)
    .map(([brand]) => formatBrandSuggestion(brand, products));

  const categorySuggestions = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORY_SUGGESTIONS)
    .map(([category]) => formatCategorySuggestion(category, products));

  return [...productSuggestions, ...brandSuggestions, ...categorySuggestions];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const locale = (searchParams.get('locale') as Locale | null) ?? 'en';

  if (query.length < MIN_SEARCH_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const supabaseResults = await searchProductsSupabase(query, locale, 20);
    const suggestions = buildSuggestionsFromProducts(supabaseResults);

    if (suggestions.length > 0) {
      return NextResponse.json({ suggestions, source: 'supabase' });
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[api/search] Supabase search failed', error);
    }
  }

  const fallback = await getAutocompleteSuggestions(query);
  return NextResponse.json({ suggestions: fallback, source: 'fallback' });
}
