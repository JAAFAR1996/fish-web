import type { AutocompleteSuggestion, Product } from '@/types';
import { getProducts } from '@/lib/data/products';

import {
  MAX_AUTOCOMPLETE_RESULTS,
  MAX_BRAND_SUGGESTIONS,
  MAX_CATEGORY_SUGGESTIONS,
  MAX_PRODUCT_SUGGESTIONS,
} from './constants';
import {
  getMatchedBrands,
  getMatchedCategories,
  getTopProductMatches,
} from './search-utils';
import {
  formatProductSuggestion,
  formatBrandSuggestion,
  formatCategorySuggestion,
  getSuggestionHref,
} from './suggestion-helpers';

export { formatProductSuggestion, formatBrandSuggestion, formatCategorySuggestion, getSuggestionHref };

export async function getAutocompleteSuggestions(
  query: string
): Promise<AutocompleteSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const products = await getProducts();

  const productSuggestions = getTopProductMatches(
    products,
    trimmed,
    MAX_PRODUCT_SUGGESTIONS
  ).map((result) => formatProductSuggestion(result.product));

  const brandSuggestions = getMatchedBrands(products, trimmed)
    .slice(0, MAX_BRAND_SUGGESTIONS)
    .map((brand) => formatBrandSuggestion(brand, products));

  const categorySuggestions = getMatchedCategories(products, trimmed)
    .slice(0, MAX_CATEGORY_SUGGESTIONS)
    .map((category) => formatCategorySuggestion(category, products));

  const suggestions = [
    ...productSuggestions,
    ...brandSuggestions,
    ...categorySuggestions,
  ];

  return suggestions.slice(0, MAX_AUTOCOMPLETE_RESULTS);
}

