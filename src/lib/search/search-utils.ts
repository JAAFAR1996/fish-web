import Fuse, { type IFuseOptions, type FuseResultMatch } from 'fuse.js';

import type { Product, SearchResult } from '@/types';
import { FUSE_THRESHOLD, MAX_PRODUCT_SUGGESTIONS } from './constants';
import { normalizeSearchText } from './text-normalizer';

const getNormalizedField = (obj: Product, path: string | string[]): string => {
  if (!path) return '';
  const segments = Array.isArray(path) ? path : path.split('.');
  let value: unknown = obj;
  for (const segment of segments) {
    if (value && typeof value === 'object' && segment in value) {
      value = (value as Record<string, unknown>)[segment];
    } else {
      value = '';
      break;
    }
  }
  return normalizeSearchText(typeof value === 'string' ? value : String(value ?? ''));
};

const FUSE_OPTIONS: IFuseOptions<Product> = {
  keys: [
    { name: 'name', weight: 1 },
    { name: 'brand', weight: 0.8 },
    { name: 'description', weight: 0.5 },
    { name: 'category', weight: 0.3 },
    { name: 'subcategory', weight: 0.3 },
  ],
  threshold: FUSE_THRESHOLD,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: false,
  getFn: getNormalizedField,
};

export function searchProducts(products: Product[], query: string): SearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  const fuse = new Fuse(products, FUSE_OPTIONS);
  return fuse
    .search(normalizedQuery)
    .map((result) => ({
      product: result.item,
      score: result.score ?? 1,
      matches: Array.from(result.matches ?? []),
    }))
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1));
}

export function searchProductsByField(
  products: Product[],
  query: string,
  field: keyof Product
): Product[] {
  const normalizedQuery = normalizeSearchText(query);
  const fuse = new Fuse(products, {
    keys: [field as string],
    threshold: 0.2,
    includeMatches: false,
    includeScore: false,
    ignoreLocation: true,
    minMatchCharLength: 2,
    getFn: getNormalizedField,
  });

  return fuse.search(normalizedQuery).map((result) => result.item);
}

export function getMatchedBrands(products: Product[], query: string): string[] {
  const matches = searchProductsByField(products, query, 'brand');
  const unique = new Set(matches.map((product) => product.brand));
  return Array.from(unique);
}

export function getMatchedCategories(products: Product[], query: string): string[] {
  const matches = searchProductsByField(products, query, 'category');
  const unique = new Set(matches.map((product) => product.category));
  return Array.from(unique);
}

export function highlightMatches(
  text: string,
  matches: FuseResultMatch[]
): { text: string; highlighted: boolean }[] {
  if (!matches.length || !text) {
    return [{ text, highlighted: false }];
  }

  const sortedRanges = matches
    .flatMap((match) => match.indices)
    .map(([start, end]) => ({ start, end }))
    .sort((a, b) => a.start - b.start);

  const mergedRanges: { start: number; end: number }[] = [];
  sortedRanges.forEach((range) => {
    const last = mergedRanges[mergedRanges.length - 1];
    if (!last || range.start > last.end + 1) {
      mergedRanges.push({ ...range });
      return;
    }
    last.end = Math.max(last.end, range.end);
  });

  const segments: { text: string; highlighted: boolean }[] = [];
  let cursor = 0;

  mergedRanges.forEach(({ start, end }) => {
    if (cursor < start) {
      segments.push({ text: text.slice(cursor, start), highlighted: false });
    }
    segments.push({ text: text.slice(start, end + 1), highlighted: true });
    cursor = end + 1;
  });

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false });
  }

  return segments.length ? segments : [{ text, highlighted: false }];
}

export function getTopProductMatches(
  products: Product[],
  query: string,
  limit = MAX_PRODUCT_SUGGESTIONS
): SearchResult[] {
  return searchProducts(products, query).slice(0, limit);
}
