'use server';

import { getSalesReport, getBestSellersReport, getAdminStats } from '@/lib/admin/reports-utils';
import type { ActionResult, BestSellerData, SalesReportData, AdminStats } from '@/types';

/**
 * Server Action: Get sales report data for a date range
 */
export async function getSalesReportAction(
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' = 'day',
): Promise<ActionResult<SalesReportData[]>> {
  try {
    const data = await getSalesReport(startDate, endDate, groupBy);
    return { ok: true, data };
  } catch (error) {
    console.error('Failed to fetch sales report', error);
    return { ok: false, error: 'failed_sales_report' };
  }
}

/**
 * Server Action: Get best sellers report
 */
export async function getBestSellersReportAction(
  limit: number = 10,
): Promise<ActionResult<BestSellerData[]>> {
  try {
    const data = await getBestSellersReport(limit);
    return { ok: true, data };
  } catch (error) {
    console.error('Failed to fetch best sellers report', error);
    return { ok: false, error: 'failed_best_sellers' };
  }
}

/**
 * Server Action: Get admin statistics
 */
export async function getAdminStatsAction(): Promise<ActionResult<AdminStats>> {
  try {
    const data = await getAdminStats();
    return { ok: true, data };
  } catch (error) {
    console.error('Failed to fetch admin stats', error);
    return { ok: false, error: 'failed_admin_stats' };
  }
}
