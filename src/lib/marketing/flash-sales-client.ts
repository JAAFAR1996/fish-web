'use client';

import type { FlashSale } from '@/types';

import { getActiveFlashSalesAction } from './flash-sales-actions';

export { isFlashSaleActive, calculateTimeRemaining, formatCountdown } from './flash-sales-helpers';

export async function getActiveFlashSalesClient(): Promise<FlashSale[]> {
  try {
    return await getActiveFlashSalesAction();
  } catch (error) {
    console.error('[Flash Sales Client] Error fetching active flash sales:', error);
    return [];
  }
}
