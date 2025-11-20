import { desc, sql } from 'drizzle-orm';

import { db } from '@server/db';
import { products as productsTable } from '@shared/schema';

import type { Locale, Product } from '@/types';
import { normalizeSupabaseProduct } from './normalize';
import type { SupabaseProductRow } from './normalize';

export async function searchProductsFTS(
  query: string,
  locale: Locale,
  limit?: number,
): Promise<Product[]> {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return [];
  }

  const config = locale === 'ar' ? 'arabic' : 'english';
  const requestedLimit = limit ?? 50;

  try {
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

    return rows.map((row) =>
      normalizeSupabaseProduct(row as unknown as SupabaseProductRow),
    );
  } catch (error) {
    console.error('[Search] Postgres full-text search failed:', error);
    throw new Error('Search failed');
  }
}
