import { desc, sql } from 'drizzle-orm';

import { db } from '@server/db';
import { products as productsTable } from '@shared/schema';

import type { Locale, Product } from '@/types';
import { normalizeSupabaseProduct } from './normalize';
import type { SupabaseProductRow } from './normalize';

type SearchOptions = {
  includeAltLocale?: boolean;
};

export async function searchProductsFTS(
  query: string,
  locale: Locale,
  limit?: number,
  options?: SearchOptions,
): Promise<Product[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const primaryConfig = locale === 'ar' ? 'arabic' : 'english';
  const secondaryConfig =
    locale === 'ar' ? 'english' : 'arabic';
  const requestedLimit = limit ?? 50;
  const configs = options?.includeAltLocale
    ? [primaryConfig, secondaryConfig]
    : [primaryConfig];
  const results: Product[] = [];

  try {
    for (const config of configs) {
      const rows = await db
        .select()
        .from(productsTable)
        .where(
          sql`
            (
              to_tsvector(${config}::regconfig, coalesce(${productsTable.name}, '')) ||
              to_tsvector(${config}::regconfig, coalesce(${productsTable.brand}, '')) ||
              to_tsvector(${config}::regconfig, coalesce(${productsTable.category}, '')) ||
              to_tsvector(${config}::regconfig, coalesce(${productsTable.subcategory}, '')) ||
              to_tsvector(${config}::regconfig, coalesce(${productsTable.description}, ''))
            ) @@ websearch_to_tsquery(${config}::regconfig, ${normalizedQuery})
          `,
        )
        .orderBy(desc(productsTable.createdAt))
        .limit(requestedLimit);

      rows.forEach((row) => {
        const product = normalizeSupabaseProduct(row as unknown as SupabaseProductRow);
        if (!results.find((existing) => existing.id === product.id)) {
          results.push(product);
        }
      });
    }

    return results.slice(0, requestedLimit);
  } catch (error) {
    console.error('[Search] Postgres full-text search failed:', error);
    throw new Error('Search failed');
  }
}
