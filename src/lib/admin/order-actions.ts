'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/auth/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendShippingUpdateEmail } from '@/lib/email/send-shipping-update';
import { createNotificationAction } from '@/lib/notifications/notification-actions';
import { routing } from '@/i18n/routing';
import { adminClient } from '@/lib/supabase/admin';
import { logError, logWarn, normalizeError } from '@/lib/logger';

import type { Locale, Order, OrderStatus, OrderUpdateData, ShippingAddressSnapshot, PaymentMethod } from '@/types';

import { AUDIT_ACTIONS, ENTITY_TYPES } from './constants';
import { createAuditLog } from './audit-utils';
import { validateOrderUpdate } from './validation';

interface DbOrderRow {
  id: string;
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  shipping_address_id: string | null;
  shipping_address: unknown;
  payment_method: string;
  status: OrderStatus;
  subtotal: number | string;
  shipping_cost: number | string;
  discount: number | string;
  loyalty_discount: number | string;
  loyalty_points_used: number | string;
  total: number | string;
  coupon_code: string | null;
  notes: string | null;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
  updated_at: string;
}

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

const normalizeOrder = (row: DbOrderRow): Order => ({
  id: row.id,
  order_number: row.order_number,
  user_id: row.user_id,
  guest_email: row.guest_email ?? null,
  shipping_address_id: row.shipping_address_id ?? null,
  shipping_address: (row.shipping_address as ShippingAddressSnapshot) ?? {} as ShippingAddressSnapshot,
  payment_method: row.payment_method as PaymentMethod,
  status: row.status,
  subtotal: Number(row.subtotal ?? 0),
  shipping_cost: Number(row.shipping_cost ?? 0),
  discount: Number(row.discount ?? 0),
  loyalty_discount: Number(row.loyalty_discount ?? 0),
  loyalty_points_used: Number(row.loyalty_points_used ?? 0),
  total: Number(row.total ?? 0),
  coupon_code: row.coupon_code ?? null,
  notes: row.notes ?? null,
  tracking_number: row.tracking_number ?? null,
  carrier: row.carrier ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

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
  const supabase = await createServerSupabaseClient();

  const { data: existingOrderRow, error: fetchError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (fetchError || !existingOrderRow) {
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

  const updatePayload: Partial<Pick<DbOrderRow, 'status' | 'tracking_number' | 'carrier' | 'notes'>> = {
    status: updateData.status,
    tracking_number: updateData.tracking_number ?? null,
    carrier: updateData.carrier ?? null,
    notes:
      updateData.notes !== undefined
        ? updateData.notes
        : existingOrder.notes,
  };

  const { data: updatedRow, error } = await supabase
    .from('orders')
    .update(updatePayload)
    .eq('id', orderId)
    .select('*')
    .single();

  if (error || !updatedRow) {
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

  if (existingOrder.status !== updateData.status && updateData.status === 'shipped') {
    try {
      let emailLocale: Locale = 'en';

      if (existingOrder.user_id) {
        try {
          const { data: userData } = await adminClient.auth.admin.getUserById(
            existingOrder.user_id,
          );
          const preferred = userData?.user?.user_metadata?.locale;

          if (preferred === 'ar' || preferred === 'en') {
            emailLocale = preferred;
          }
        } catch (localeError) {
          const { errorMessage, errorStack } = normalizeError(localeError);
          logWarn('Failed to resolve user locale for shipping email', {
            action: 'updateOrderStatus',
            adminId: admin.id,
            orderId,
            errorMessage,
            errorStack,
          });
        }
      } else if (typeof existingOrderRow.locale === 'string') {
        const orderLocale = existingOrderRow.locale;
        if (orderLocale === 'ar' || orderLocale === 'en') {
          emailLocale = orderLocale;
        }
      }

      await sendShippingUpdateEmail({
        order: { ...existingOrder, ...updatePayload, status: updateData.status },
        trackingNumber: updateData.tracking_number ?? '',
        carrier: updateData.carrier ?? '',
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
      const { count: itemsCount } = await supabase
        .from('order_items')
        .select('id', { count: 'exact', head: true })
        .eq('order_id', orderId);

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
          items_count: itemsCount ?? 0,
          tracking_number: updateData.tracking_number ?? undefined,
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
  const supabase = await createServerSupabaseClient();

  let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters?.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error || !data) {
    if (error) {
      const { errorMessage, errorStack } = normalizeError(error);
      logError('Failed to fetch admin orders', {
        action: 'getOrdersForAdmin',
        errorMessage,
        errorStack,
      });
    }
    return [];
  }

  return data.map((row) => normalizeOrder(row));
}

export async function getOrderStatsAction(): Promise<{
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
}> {
  await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const [totalOrdersResponse, pendingOrdersResponse, revenueResponse] = await Promise.all([
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase.from('orders').select('total,status'),
  ]);

  const totalRevenue =
    revenueResponse.data?.reduce((sum, order) => {
      if (order.status === 'cancelled') {
        return sum;
      }
      return sum + Number(order.total ?? 0);
    }, 0) ?? 0;

  return {
    totalOrders: totalOrdersResponse.count ?? 0,
    pendingOrders: pendingOrdersResponse.count ?? 0,
    totalRevenue,
  };
}
