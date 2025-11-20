import 'server-only';

import { and, eq, gte, lte, ne, sql } from 'drizzle-orm';

import { db } from '@server/db';
import { flashSales, orderItems, orders, products, reviews } from '@shared/schema';

import { requireAdmin } from '@/lib/auth/utils';

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

  const parsedStart = Number.isNaN(Date.parse(startDate))
    ? new Date('1970-01-01T00:00:00Z')
    : new Date(startDate);
  const parsedEnd = Number.isNaN(Date.parse(endDate)) ? new Date() : new Date(endDate);

  try {
    const rows = await db
      .select({
        createdAt: orders.createdAt,
        total: orders.total,
        userId: orders.userId,
        status: orders.status,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, parsedStart),
          lte(orders.createdAt, parsedEnd),
          ne(orders.status, 'cancelled'),
        ),
      );

    if (!rows.length) {
      return [];
    }

    const buckets = new Map<
      string,
      { revenue: number; orders: number; customers: Set<string> }
    >();

    rows.forEach((order) => {
      const createdAtValue =
        order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt ?? '');
      if (Number.isNaN(createdAtValue.getTime())) {
        return;
      }

      const key = formatGroupDate(createdAtValue, groupBy);
      const bucket =
        buckets.get(key) ??
        { revenue: 0, orders: 0, customers: new Set<string>() };

      bucket.revenue += Number(order.total ?? 0);
      bucket.orders += 1;

      if (order.userId) {
        bucket.customers.add(order.userId);
      } else {
        bucket.customers.add(`guest-${createdAtValue.toISOString()}`);
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
  } catch (error) {
    console.error('Failed to fetch sales report data', error);
    return [];
  }
}

export async function getBestSellersReport(
  limit: number = 10,
): Promise<BestSellerData[]> {
  await requireAdmin();

  try {
    const rows = await db
      .select({
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        subtotal: orderItems.subtotal,
        productSnapshot: orderItems.productSnapshot,
        orderStatus: orders.status,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .limit(1000);

    if (!rows.length) {
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

    rows.forEach((item) => {
      if (item.orderStatus === 'cancelled') {
        return;
      }

      const snapshot = item.productSnapshot as {
        name?: string;
        thumbnail?: string;
      } | null;

      const entry =
        aggregates.get(item.productId) ??
        {
          product_name: snapshot?.name ?? item.productId,
          product_thumbnail: snapshot?.thumbnail ?? '',
          total_quantity: 0,
          total_revenue: 0,
          orderIds: new Set<string>(),
        };

      entry.total_quantity += Number(item.quantity ?? 0);
      entry.total_revenue += Number(item.subtotal ?? 0);
      if (item.orderId) {
        entry.orderIds.add(item.orderId);
      }

      aggregates.set(item.productId, entry);
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
  } catch (error) {
    console.error('Failed to fetch best sellers data', error);
    return [];
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireAdmin();
  const now = new Date();
  try {
    const [
      totalOrdersResponse,
      pendingOrdersResponse,
      totalProductsResponse,
      lowStockProductsRows,
      reviewsResponse,
      flashSalesResponse,
      ordersForRevenue,
    ] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)::int` }).from(orders),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(orders)
        .where(eq(orders.status, 'pending')),
      db.select({ count: sql<number>`COUNT(*)::int` }).from(products),
      db.select({ stock: products.stock, lowStockThreshold: products.lowStockThreshold }).from(products),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(reviews)
        .where(eq(reviews.isApproved, false)),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(flashSales)
        .where(
          and(
            eq(flashSales.isActive, true),
            lte(flashSales.startsAt, now),
            sql`${flashSales.endsAt} > ${now}`,
          ),
        ),
      db
        .select({
          total: orders.total,
          status: orders.status,
          userId: orders.userId,
        })
        .from(orders),
    ]);

    const totalOrders = totalOrdersResponse[0]?.count ?? 0;
    const pendingOrders = pendingOrdersResponse[0]?.count ?? 0;
    const totalProducts = totalProductsResponse[0]?.count ?? 0;
    const pendingReviews = reviewsResponse[0]?.count ?? 0;
    const activeFlashSales = flashSalesResponse[0]?.count ?? 0;

    const lowStockProducts = lowStockProductsRows.filter((product) => {
      const stock = Number(product.stock ?? 0);
      const threshold =
        product.lowStockThreshold !== null && product.lowStockThreshold !== undefined
          ? Number(product.lowStockThreshold)
          : 0;
      return threshold > 0 && stock > 0 && stock <= threshold;
    }).length;

    const revenueAggregation = ordersForRevenue.reduce(
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

        if (order.userId) {
          acc.customers.add(order.userId);
        }

        return acc;
      },
      { revenue: 0, customers: new Set<string>() },
    );

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
  } catch (error) {
    console.error('Failed to compute admin stats', error);
    return {
      totalOrders: 0,
      pendingOrders: 0,
      totalProducts: 0,
      pendingReviews: 0,
      activeFlashSales: 0,
      lowStockProducts: 0,
      totalRevenue: 0,
      totalCustomers: 0,
    };
  }
}
