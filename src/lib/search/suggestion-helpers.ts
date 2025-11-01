import type { AutocompleteSuggestion, Product } from '@/types';

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
): AutocompleteSuggestion {
  const count = products.filter((product) => product.brand === brand).length;

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
): AutocompleteSuggestion {
  const count = products.filter((product) => product.category === category).length;

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

  return `/${locale}/search?q=${encodeURIComponent(suggestion.label)}`;
}
