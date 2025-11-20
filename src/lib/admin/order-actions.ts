'use server';

import { revalidatePath } from 'next/cache';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

import { db } from '@server/db';
import { orderItems, orders } from '@shared/schema';

import { requireAdmin } from '@/lib/auth/utils';
import { sendShippingUpdateEmail } from '@/lib/email/send-shipping-update';
import { createNotificationAction } from '@/lib/notifications/notification-actions';
import { routing } from '@/i18n/routing';
import { logError, logWarn, normalizeError } from '@/lib/logger';

import type {
  Locale,
  Order,
  OrderStatus,
  OrderUpdateData,
  ShippingAddressSnapshot,
  PaymentMethod,
} from '@/types';

import { AUDIT_ACTIONS, ENTITY_TYPES } from './constants';
import { createAuditLog } from './audit-utils';
import { validateOrderUpdate } from './validation';

type OrderRow = typeof orders.$inferSelect;

const revalidateOrders = () => {
  routing.locales.forEach((locale) => {
    revalidatePath(`/${locale}/admin`, 'page');
    revalidatePath(`/${locale}/account`, 'page');
  });
};

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const normalizeOrder = (row: OrderRow): Order => {
  const shippingAddress =
    (row.shippingAddress as ShippingAddressSnapshot | null) ?? ({} as ShippingAddressSnapshot);

  return {
    id: row.id,
    order_number: row.orderNumber,
    user_id: row.userId,
    guest_email: row.guestEmail ?? null,
    shipping_address_id: row.shippingAddressId ?? null,
    shipping_address: shippingAddress,
    payment_method: row.paymentMethod as PaymentMethod,
    status: row.status as OrderStatus,
    subtotal: Number(row.subtotal ?? 0),
    shipping_cost: Number(row.shippingCost ?? 0),
    discount: Number(row.discount ?? 0),
    loyalty_discount: Number(row.loyaltyDiscount ?? 0),
    loyalty_points_used: Number(row.loyaltyPointsUsed ?? 0),
    total: Number(row.total ?? 0),
    coupon_code: row.couponCode ?? null,
    notes: row.notes ?? null,
    tracking_number: row.trackingNumber ?? null,
    carrier: row.carrier ?? null,
    created_at:
      row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt ?? '',
    updated_at:
      row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt ?? '',
  };
};

const isTransitionAllowed = (current: OrderStatus, next: OrderStatus): boolean => {
  if (current === next) {
    return true;
  }
  return allowedTransitions[current]?.includes(next) ?? false;
};

export async function updateOrderStatusAction(
  orderId: string,
  updateData: OrderUpdateData,
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();

  let existingOrderRow: OrderRow | undefined;
  try {
    [existingOrderRow] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
  } catch (fetchError) {
    const { errorMessage, errorStack } = normalizeError(fetchError);
    logError('Failed to load order for update', {
      action: 'updateOrderStatus',
      adminId: admin.id,
      orderId,
      errorMessage,
      errorStack,
    });
    return { success: false, error: 'orders.errors.orderNotFound' };
  }

  if (!existingOrderRow) {
    logError('Failed to load order for update', {
      action: 'updateOrderStatus',
      adminId: admin.id,
      orderId,
      errorMessage: 'Order not found',
      errorStack: undefined,
    });
    return { success: false, error: 'orders.errors.orderNotFound' };
  }

  const existingOrder = normalizeOrder(existingOrderRow);

  if (!isTransitionAllowed(existingOrder.status, updateData.status)) {
    return { success: false, error: 'orders.errors.invalidTransition' };
  }

  const validation = validateOrderUpdate(updateData);
  if (!validation.valid) {
    return {
      success: false,
      error: Object.values(validation.errors)[0] ?? 'orders.errors.updateFailed',
    };
  }

  const updatePayload = {
    status: updateData.status,
    trackingNumber: updateData.tracking_number ?? null,
    carrier: updateData.carrier ?? null,
    notes:
      updateData.notes !== undefined
        ? updateData.notes
        : existingOrder.notes,
  };

  let updatedRow: OrderRow | undefined;
  try {
    [updatedRow] = await db
      .update(orders)
      .set(updatePayload)
      .where(eq(orders.id, orderId))
      .returning();
  } catch (error) {
    const { errorMessage, errorStack } = normalizeError(error);
    logError('Failed to update order status', {
      action: 'updateOrderStatus',
      adminId: admin.id,
      orderId,
      errorMessage,
      errorStack,
    });
    return { success: false, error: 'orders.errors.updateFailed' };
  }

  if (!updatedRow) {
    logError('Failed to update order status', {
      action: 'updateOrderStatus',
      adminId: admin.id,
      orderId,
      errorMessage: 'No updated row returned',
      errorStack: undefined,
    });
    return { success: false, error: 'orders.errors.updateFailed' };
  }

  const updatedOrder = normalizeOrder(updatedRow);

  if (existingOrder.status !== updateData.status && updateData.status === 'shipped') {
    try {
      const emailLocale: Locale = 'en';

      await sendShippingUpdateEmail({
        order: updatedOrder,
        trackingNumber: updatedOrder.tracking_number ?? '',
        carrier: updatedOrder.carrier ?? '',
        locale: emailLocale,
      });
    } catch (emailError) {
      const { errorMessage, errorStack } = normalizeError(emailError);
      logError('Failed to send shipping update email', {
        action: 'updateOrderStatus',
        adminId: admin.id,
        orderId,
        errorMessage,
        errorStack,
      });
    }

    if (existingOrder.user_id) {
      let itemsCount = 0;
      try {
        const [countResult] = await db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(orderItems)
          .where(eq(orderItems.orderId, orderId));
        itemsCount = countResult?.count ?? 0;
      } catch (countError) {
        const { errorMessage, errorStack } = normalizeError(countError);
        logWarn('Failed to count order items for notification', {
          action: 'updateOrderStatus',
          adminId: admin.id,
          orderId,
          errorMessage,
          errorStack,
        });
      }

      await createNotificationAction(
        existingOrder.user_id,
        'shipping_update',
        'Your order is on the way!',
        'We shipped your order. Track it with the details you provided.',
        {
          type: 'shipping_update',
          order_id: existingOrder.id,
          order_number: existingOrder.order_number,
          total: existingOrder.total,
          items_count: itemsCount,
          tracking_number: updatedOrder.tracking_number ?? undefined,
        },
        `/account/orders/${existingOrder.id}`,
      );
    }
  }

  await createAuditLog(
    admin.id,
    AUDIT_ACTIONS.ORDER_UPDATED,
    ENTITY_TYPES.ORDER,
    orderId,
    {
      before: existingOrderRow,
      after: updatedRow,
    },
  );

  revalidateOrders();

  return { success: true };
}

export async function getOrdersForAdmin(
  filters?: {
    status?: OrderStatus;
    dateFrom?: string;
    dateTo?: string;
  },
  limit?: number,
): Promise<Order[]> {
  await requireAdmin();

  try {
    let query = db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .$dynamic();

    const conditions: SQL[] = [];
    if (filters?.status) {
      conditions.push(eq(orders.status, filters.status));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(orders.createdAt, new Date(filters.dateFrom)));
    }
    if (filters?.dateTo) {
      conditions.push(lte(orders.createdAt, new Date(filters.dateTo)));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    if (typeof limit === 'number') {
      query = query.limit(limit);
    }

    const rows = await query;
    return rows.map((row) => normalizeOrder(row));
  } catch (error) {
    const { errorMessage, errorStack } = normalizeError(error);
    logError('Failed to fetch admin orders', {
      action: 'getOrdersForAdmin',
      errorMessage,
      errorStack,
    });
    return [];
  }
}

export async function getOrderStatsAction(): Promise<{
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}> {
  await requireAdmin();

  try {
    const [totalOrdersResponse, pendingOrdersResponse, revenueRows] = await Promise.all([
      db.select({ count: sql<number>`COUNT(*)::int` }).from(orders),
      db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(orders)
        .where(eq(orders.status, 'pending')),
      db.select({ total: orders.total, status: orders.status }).from(orders),
    ]);

    const totalOrders = totalOrdersResponse[0]?.count ?? 0;
    const pendingOrders = pendingOrdersResponse[0]?.count ?? 0;

    const totalRevenue = revenueRows.reduce((sum, order) => {
      if (order.status === 'cancelled') {
        return sum;
      }
      return sum + Number(order.total ?? 0);
    }, 0);

    return {
      totalOrders,
      pendingOrders,
      totalRevenue,
    };
  } catch (error) {
    const { errorMessage, errorStack } = normalizeError(error);
    logError('Failed to compute order stats', {
      action: 'getOrderStats',
      errorMessage,
      errorStack,
    });
    return {
      totalOrders: 0,
      pendingOrders: 0,
      totalRevenue: 0,
    };
  }
}
