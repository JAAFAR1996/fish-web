'use server';

import type { FlashSale } from '@/types';

import { getActiveFlashSales } from './flash-sales-utils';

export async function getActiveFlashSalesAction(): Promise<FlashSale[]> {
  try {
    return await getActiveFlashSales();
  } catch (error) {
    console.error('[Flash Sales Action] Error fetching active flash sales:', error);
    return [];
  }
}
