import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { FlashSale } from '@/types';
export { isFlashSaleActive, calculateTimeRemaining, formatCountdown } from './flash-sales-helpers';

const RPC_INCREMENT_FLASH_SALE_STOCK = 'increment_flash_sale_stock';
const RPC_PARAM_SALE_ID = 'p_sale_id';
const RPC_PARAM_QUANTITY = 'p_qty';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type IncrementFlashSaleStockResult = number | null;

/**
 * Get all active flash sales (started and not ended)
 */
export async function getActiveFlashSales(): Promise<FlashSale[]> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('flash_sales')
    .select('*')
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .order('ends_at', { ascending: true });

  if (error) {
    console.error('[Flash Sales] Error fetching active flash sales:', error);
    return [];
  }

  return data as FlashSale[];
}

/**
 * Get flash sale for a specific product
 */
export async function getFlashSaleForProduct(productId: string): Promise<FlashSale | null> {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('flash_sales')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .lte('starts_at', now)
    .gte('ends_at', now)
    .maybeSingle();

  if (error) {
    console.error(`[Flash Sales] Error fetching flash sale for product ${productId}:`, error);
    return null;
  }

  return data as FlashSale | null;
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
export async function incrementFlashSaleSold(flashSaleId: string, quantity: number): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc(
    RPC_INCREMENT_FLASH_SALE_STOCK,
    {
      [RPC_PARAM_SALE_ID]: flashSaleId,
      [RPC_PARAM_QUANTITY]: quantity,
    }
  );

  if (error) {
    console.error(`[Flash Sales] Error incrementing stock for ${flashSaleId}:`, error);
    return;
  }

  if (typeof data !== 'number') {
    console.error('[Flash Sales] Unexpected increment result', {
      flashSaleId,
      quantity,
      data,
    });
  }
}
