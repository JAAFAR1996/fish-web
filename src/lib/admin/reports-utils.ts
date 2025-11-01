import 'server-only';

import { requireAdmin } from '@/lib/auth/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';

import type { AdminStats, BestSellerData, SalesReportData } from '@/types';

// This module uses server-only dependencies and can only be imported in
// Server Components, Server Actions, or API Routes.
// Client components should use the Server Actions from @/lib/admin/reports-actions instead.

const formatGroupDate = (date: Date, groupBy: 'day' | 'week' | 'month'): string => {
  const utcYear = date.getUTCFullYear();
  const utcMonth = date.getUTCMonth();
  const utcDate = date.getUTCDate();

  if (groupBy === 'month') {
    return `${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-01`;
  }

  if (groupBy === 'week') {
    const day = date.getUTCDay();
    const diff = (day + 6) % 7;
    const monday = new Date(Date.UTC(utcYear, utcMonth, utcDate - diff));
    return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(
      2,
      '0',
    )}-${String(monday.getUTCDate()).padStart(2, '0')}`;
  }

  return `${utcYear}-${String(utcMonth + 1).padStart(2, '0')}-${String(utcDate).padStart(
    2,
    '0',
  )}`;
};

export async function getSalesReport(
  startDate: string,
  endDate: string,
  groupBy: 'day' | 'week' | 'month' = 'day',
): Promise<SalesReportData[]> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select('created_at,total,user_id,status')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .neq('status', 'cancelled');

  if (error || !data) {
    if (error) {
      console.error('Failed to fetch sales report data', error);
    }
    return [];
  }

  const buckets = new Map<
    string,
    { revenue: number; orders: number; customers: Set<string> }
  >();

  data.forEach((order) => {
    const createdAt = new Date(order.created_at);
    const key = formatGroupDate(createdAt, groupBy);
    const bucket =
      buckets.get(key) ??
      { revenue: 0, orders: 0, customers: new Set<string>() };

    bucket.revenue += Number(order.total ?? 0);
    bucket.orders += 1;

    if (order.user_id) {
      bucket.customers.add(order.user_id);
    } else if (order.status !== 'cancelled' && order.user_id === null) {
      bucket.customers.add(`guest-${order.created_at}`);
    }

    buckets.set(key, bucket);
  });

  return Array.from(buckets.entries())
    .map(([date, bucket]) => ({
      date,
      revenue: bucket.revenue,
      orders: bucket.orders,
      customers: bucket.customers.size,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getBestSellersReport(
  limit: number = 10,
): Promise<BestSellerData[]> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('order_items')
    .select('order_id,product_id,quantity,subtotal,product_snapshot,orders!inner(status)')
    .limit(1000);

  if (error || !data) {
    if (error) {
      console.error('Failed to fetch best sellers data', error);
    }
    return [];
  }

  const aggregates = new Map<
    string,
    {
      product_name: string;
      product_thumbnail: string;
      total_quantity: number;
      total_revenue: number;
      orderIds: Set<string>;
    }
  >();

  data.forEach((item) => {
    if (item.orders?.status === 'cancelled') {
      return;
    }

    const snapshot = item.product_snapshot as {
      name?: string;
      thumbnail?: string;
    };
    const entry =
      aggregates.get(item.product_id) ??
      {
        product_name: snapshot?.name ?? item.product_id,
        product_thumbnail: snapshot?.thumbnail ?? '',
        total_quantity: 0,
        total_revenue: 0,
        orderIds: new Set<string>(),
      };

    entry.total_quantity += Number(item.quantity ?? 0);
    entry.total_revenue += Number(item.subtotal ?? 0);
    if (item.order_id) {
      entry.orderIds.add(item.order_id);
    }

    aggregates.set(item.product_id, entry);
  });

  return Array.from(aggregates.entries())
    .map(([product_id, value]) => ({
      product_id,
      product_name: value.product_name,
      product_thumbnail: value.product_thumbnail,
      total_quantity: value.total_quantity,
      total_revenue: value.total_revenue,
      order_count: value.orderIds.size,
    }))
    .sort((a, b) => b.total_revenue - a.total_revenue)
    .slice(0, limit);
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();

  const [
    totalOrdersResponse,
    pendingOrdersResponse,
    totalProductsResponse,
    lowStockProductsResponse,
    reviewsResponse,
    flashSalesResponse,
    ordersForRevenue,
  ] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('stock,low_stock_threshold'),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', false),
    supabase
      .from('flash_sales')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true)
      .lte('starts_at', now)
      .gt('ends_at', now),
    supabase.from('orders').select('total,status,user_id'),
  ]);

  const totalOrders = totalOrdersResponse.count ?? 0;
  const pendingOrders = pendingOrdersResponse.count ?? 0;
  const totalProducts = totalProductsResponse.count ?? 0;
  const pendingReviews = reviewsResponse.count ?? 0;
  const activeFlashSales = flashSalesResponse.count ?? 0;

  const lowStockProducts =
    lowStockProductsResponse.data?.filter((product) => {
      const stock = Number(product.stock ?? 0);
      const threshold = Number(product.low_stock_threshold ?? 0);
      return stock > 0 && stock <= threshold;
    }).length ?? 0;

  const revenueAggregation =
    ordersForRevenue.data?.reduce(
      (
        acc: {
          revenue: number;
          customers: Set<string>;
        },
        order,
      ) => {
        if (order.status === 'cancelled') {
          return acc;
        }

        acc.revenue += Number(order.total ?? 0);

        if (order.user_id) {
          acc.customers.add(order.user_id);
        }

        return acc;
      },
      { revenue: 0, customers: new Set<string>() },
    ) ?? { revenue: 0, customers: new Set<string>() };

  return {
    totalOrders,
    pendingOrders,
    totalProducts,
    pendingReviews,
    activeFlashSales,
    lowStockProducts,
    totalRevenue: revenueAggregation.revenue,
    totalCustomers: revenueAggregation.customers.size,
  };
}
