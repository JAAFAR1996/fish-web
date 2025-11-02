import { getBrowserSupabaseClient } from '@/lib/supabase/client';
import type { FlashSale } from '@/types';
export { isFlashSaleActive, calculateTimeRemaining, formatCountdown } from './flash-sales-helpers';

/**
 * Client-safe: Get all active flash sales (started and not ended)
 */
export async function getActiveFlashSalesClient(): Promise<FlashSale[]> {
  try {
    const supabase = getBrowserSupabaseClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('flash_sales')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('ends_at', { ascending: true });

    if (error) {
      console.error('[Flash Sales Client] Error fetching active flash sales:', error);
      return [];
    }

    return (data ?? []) as FlashSale[];
  } catch (err) {
    console.error('[Flash Sales Client] Unexpected error:', err);
    return [];
  }
}
