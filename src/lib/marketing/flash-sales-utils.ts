import { db } from '@server/db';
import { flashSales } from '@shared/schema';
import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';

import type { FlashSale } from '@/types';
export { isFlashSaleActive, calculateTimeRemaining, formatCountdown } from './flash-sales-helpers';

let flashSalesErrorLogged = false;

function logFlashSaleFallback(error: unknown) {
  if (flashSalesErrorLogged) return;
  flashSalesErrorLogged = true;
  console.warn('[Flash Sales] Falling back to empty flash sales; database query failed', error);
}

const toIsoString = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : value ?? new Date(0).toISOString();

type FlashSaleRow = typeof flashSales.$inferSelect;

function transformFlashSale(row: FlashSaleRow): FlashSale {
  return {
    id: row.id,
    product_id: row.productId,
    flash_price: Number.parseFloat(String(row.flashPrice ?? 0)),
    original_price: Number.parseFloat(String(row.originalPrice ?? 0)),
    stock_limit: row.stockLimit,
    stock_sold: row.stockSold,
    starts_at: toIsoString(row.startsAt),
    ends_at: toIsoString(row.endsAt),
    is_active: row.isActive,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  };
}

/**
 * Get all active flash sales (started and not ended)
 */
export async function getActiveFlashSales(): Promise<FlashSale[]> {
  const now = new Date();

  try {
    const rows = await db
      .select()
      .from(flashSales)
      .where(
        and(
          eq(flashSales.isActive, true),
          lte(flashSales.startsAt, now),
          gte(flashSales.endsAt, now),
        ),
      )
      .orderBy(asc(flashSales.endsAt));

    return rows.map(transformFlashSale);
  } catch (error) {
    logFlashSaleFallback(error);
    return [];
  }
}

/**
 * Get flash sale for a specific product
 */
export async function getFlashSaleForProduct(productId: string): Promise<FlashSale | null> {
  const now = new Date();

  try {
    const [row] = await db
      .select()
      .from(flashSales)
      .where(
        and(
          eq(flashSales.productId, productId),
          eq(flashSales.isActive, true),
          lte(flashSales.startsAt, now),
          gte(flashSales.endsAt, now),
        ),
      )
      .limit(1);

    return row ? transformFlashSale(row) : null;
  } catch (error) {
    logFlashSaleFallback(error);
    return null;
  }
}

/**
 * Check if flash sale has enough stock for purchase
 */
export function canPurchaseFlashSale(flashSale: FlashSale, requestedQuantity: number): boolean {
  return flashSale.stock_sold + requestedQuantity <= flashSale.stock_limit;
}

/**
 * Increment flash sale stock sold count (called when item purchased)
 * Uses SQL increment to prevent race conditions
 */
export async function incrementFlashSaleSold(flashSaleId: string, quantity: number): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await db
      .update(flashSales)
      .set({
        stockSold: sql`${flashSales.stockSold} + ${quantity}`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(flashSales.id, flashSaleId),
          sql`${flashSales.stockSold} + ${quantity} <= ${flashSales.stockLimit}`
        )
      )
      .returning({ id: flashSales.id });

    if (result.length === 0) {
      return { success: false, error: 'Insufficient flash sale stock' };
    }

    return { success: true };
  } catch (error) {
    console.error(`[Flash Sales] Error incrementing stock for ${flashSaleId}:`, error);
    return { success: false, error: 'Failed to increment flash sale stock' };
  }
}
