import { NextResponse } from 'next/server';

import type { AutocompleteSuggestion, Locale, Product } from '@/types';
import { MAX_SEARCH_QUERY_LENGTH, SEARCH_FALLBACK_CACHE_TTL_MS } from '@/lib/config/perf';
import { logError, logWarn } from '@/lib/logger';
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
import { searchProductsFTS } from '@/lib/search/postgres-search';
import { getProducts } from '@/lib/data/products';

const FALLBACK_CACHE_MAX_ENTRIES = 100;

type FallbackCacheEntry = {
  suggestions: AutocompleteSuggestion[];
  expiresAt: number;
};

const fallbackSuggestionCache = new Map<string, FallbackCacheEntry>();

function sanitizeQuery(rawQuery: string): string {
  const normalized = rawQuery.normalize('NFKC');
  const withoutControl = normalized.replace(/[\u0000-\u001F\u007F]/g, ' ');
  const withoutOperators = withoutControl.replace(/[&|!:"()*]/g, ' ');
  const allowList = /[^\p{L}\p{M}\p{N}\s\-'",.]/gu;
  return withoutOperators.replace(allowList, ' ').replace(/\s+/g, ' ').trim();
}

function pruneExpiredFallbackEntries(now: number) {
  for (const [key, entry] of fallbackSuggestionCache.entries()) {
    if (entry.expiresAt <= now) {
      fallbackSuggestionCache.delete(key);
    }
  }
}

function getCachedFallback(key: string): AutocompleteSuggestion[] | null {
  const entry = fallbackSuggestionCache.get(key);
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    fallbackSuggestionCache.delete(key);
    return null;
  }

  return entry.suggestions;
}

function setCachedFallback(key: string, suggestions: AutocompleteSuggestion[]) {
  const now = Date.now();
  pruneExpiredFallbackEntries(now);

  if (fallbackSuggestionCache.size >= FALLBACK_CACHE_MAX_ENTRIES) {
    const oldestKey = fallbackSuggestionCache.keys().next().value;
    if (oldestKey) {
      fallbackSuggestionCache.delete(oldestKey);
    }
  }

  fallbackSuggestionCache.set(key, {
    suggestions,
    expiresAt: now + SEARCH_FALLBACK_CACHE_TTL_MS,
  });
}

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
    .map(([brand, count]) => formatBrandSuggestion(brand, count));

  const categorySuggestions = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_CATEGORY_SUGGESTIONS)
    .map(([category, count]) => formatCategorySuggestion(category, count));

  return [...productSuggestions, ...brandSuggestions, ...categorySuggestions];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q') ?? '';
  const locale = (searchParams.get('locale') as Locale | null) ?? 'en';

  const sanitizedQuery = sanitizeQuery(rawQuery);

  if (!sanitizedQuery) {
    logWarn('Search query sanitized to empty string', { rawQuery, locale });
    return NextResponse.json(
      { suggestions: [], error: 'query_invalid' },
      { status: 400 }
    );
  }

  if (sanitizedQuery.length > MAX_SEARCH_QUERY_LENGTH) {
    const truncated = sanitizedQuery.slice(0, MAX_SEARCH_QUERY_LENGTH).trimEnd();
    return NextResponse.json(
      {
        suggestions: [],
        error: 'query_too_long',
      },
      { status: 400, headers: { 'x-truncated-query': truncated } }
    );
  }

  if (sanitizedQuery.length < MIN_SEARCH_LENGTH) {
    return NextResponse.json({ suggestions: [] });
  }

  try {
    const dbResults = await searchProductsFTS(sanitizedQuery, locale, 20);
    const suggestions = buildSuggestionsFromProducts(dbResults);

    if (suggestions.length > 0) {
      return NextResponse.json({ suggestions, source: 'postgres' });
    }
  } catch (error) {
    logError('Postgres search failed', {
      locale,
      errorMessage: error instanceof Error ? error.message : String(error),
      query: sanitizedQuery,
    });
  }

  const cacheKey = `${locale}:${sanitizedQuery.toLowerCase()}`;
  const cachedSuggestions = getCachedFallback(cacheKey);

  if (cachedSuggestions) {
    return NextResponse.json(
      { suggestions: cachedSuggestions, source: 'fallback-cache' },
      { headers: { 'x-search-fallback-cache': 'hit' } }
    );
  }

  const products = await getProducts();
  const fallback = getAutocompleteSuggestions(sanitizedQuery, products);
  setCachedFallback(cacheKey, fallback);

  return NextResponse.json(
    { suggestions: fallback, source: 'fallback' },
    { headers: { 'x-search-fallback-cache': 'miss' } }
  );
}
