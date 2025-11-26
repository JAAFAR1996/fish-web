import type { AutocompleteSuggestion, BlogPost, Product } from '@/types';

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

export function getAutocompleteSuggestions(
  query: string,
  products: Product[],
  articles: BlogPost[] = []
): AutocompleteSuggestion[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

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

  const articleSuggestions = articles
    .filter((post) =>
      post.title.toLowerCase().includes(trimmed.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(trimmed.toLowerCase())
    )
    .slice(0, 4)
    .map((post) => formatArticleSuggestion(post));

  const suggestions = [
    ...productSuggestions,
    ...brandSuggestions,
    ...categorySuggestions,
    ...articleSuggestions,
  ];

  return suggestions.slice(0, MAX_AUTOCOMPLETE_RESULTS);
}

export function formatProductSuggestion(product: Product): AutocompleteSuggestion {
  return {
    type: 'product',
    value: product.id,
    label: product.name,
    product,
    count: null,
    thumbnail: product.thumbnail ?? null,
  };
}

export function formatBrandSuggestion(
  brand: string,
  products: Product[]
): AutocompleteSuggestion;
export function formatBrandSuggestion(
  brand: string,
  count: number
): AutocompleteSuggestion;
export function formatBrandSuggestion(
  brand: string,
  productsOrCount: Product[] | number
): AutocompleteSuggestion {
  const count = typeof productsOrCount === 'number'
    ? productsOrCount
    : productsOrCount.filter((product) => product.brand === brand).length;

  return {
    type: 'brand',
    value: brand,
    label: brand,
    product: null,
    count,
    thumbnail: null,
  };
}

export function formatCategorySuggestion(
  category: string,
  products: Product[]
): AutocompleteSuggestion;
export function formatCategorySuggestion(
  category: string,
  count: number
): AutocompleteSuggestion;
export function formatCategorySuggestion(
  category: string,
  productsOrCount: Product[] | number
): AutocompleteSuggestion {
  const count = typeof productsOrCount === 'number'
    ? productsOrCount
    : productsOrCount.filter((product) => product.category === category).length;

  return {
    type: 'category',
    value: category,
    label: category,
    product: null,
    count,
    thumbnail: null,
  };
}

export function getSuggestionHref(
  suggestion: AutocompleteSuggestion,
  locale: string
): string {
  if (suggestion.type === 'product' && suggestion.product) {
    return `/${locale}/products/${suggestion.product.slug}`;
  }

  if (suggestion.type === 'brand') {
    const encoded = encodeURIComponent(suggestion.value);
    return `/${locale}/search?q=${encoded}&brand=${encoded}`;
  }

  if (suggestion.type === 'category') {
    return `/${locale}/products?category=${encodeURIComponent(suggestion.value)}`;
  }

  if (suggestion.type === 'article' && suggestion.slug) {
    return `/${locale}/blog/${suggestion.slug}`;
  }

  return `/${locale}/search?q=${encodeURIComponent(suggestion.label)}`;
}

export function formatArticleSuggestion(post: BlogPost): AutocompleteSuggestion {
  return {
    type: 'article',
    value: post.slug,
    slug: post.slug,
    label: post.title,
    product: null,
    count: post.readingTime ?? null,
    thumbnail: post.coverImage ?? null,
    readingTime: post.readingTime ?? null,
  };
}
