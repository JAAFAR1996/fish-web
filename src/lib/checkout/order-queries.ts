import { desc, eq } from 'drizzle-orm';

import { db } from '@server/db';
import { orderItems, orders } from '@shared/schema';

import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderWithItems,
  PaymentMethod,
  ProductSnapshot,
  ShippingAddressSnapshot,
} from '@/types';

interface CreateOrderInput {
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  shipping_address_id: string | null;
  shipping_address: ShippingAddressSnapshot;
  payment_method: PaymentMethod;
  status: OrderStatus;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  loyalty_discount: number;
  loyalty_points_used: number;
  total: number;
  coupon_code: string | null;
  notes: string | null;
}

const toNumber = (value: unknown): number =>
  typeof value === 'number' ? value : Number(value ?? 0);

const toIsoString = (value: Date | string | null | undefined): string => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return new Date().toISOString();
};

export function transformOrder(row: typeof orders.$inferSelect): Order {
  return {
    id: row.id,
    order_number: row.orderNumber,
    user_id: row.userId ?? null,
    guest_email: row.guestEmail ?? null,
    shipping_address_id: row.shippingAddressId ?? null,
    shipping_address: row.shippingAddress as ShippingAddressSnapshot,
    payment_method: row.paymentMethod as PaymentMethod,
    status: row.status as OrderStatus,
    subtotal: toNumber(row.subtotal),
    shipping_cost: toNumber(row.shippingCost),
    discount: toNumber(row.discount),
    loyalty_discount: toNumber(row.loyaltyDiscount),
    loyalty_points_used: row.loyaltyPointsUsed ?? 0,
    total: toNumber(row.total),
    coupon_code: row.couponCode ?? null,
    notes: row.notes ?? null,
    tracking_number: row.trackingNumber ?? null,
    carrier: row.carrier ?? null,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  };
}

export function transformOrderItem(row: typeof orderItems.$inferSelect): OrderItem {
  return {
    id: row.id,
    order_id: row.orderId,
    product_id: row.productId,
    product_snapshot: row.productSnapshot as ProductSnapshot,
    quantity: row.quantity,
    unit_price: toNumber(row.unitPrice),
    subtotal: toNumber(row.subtotal),
    created_at: toIsoString(row.createdAt),
  };
}

export async function createOrder(orderData: CreateOrderInput): Promise<Order> {
  try {
    const [row] = await db
      .insert(orders)
      .values({
        orderNumber: orderData.order_number,
        userId: orderData.user_id,
        guestEmail: orderData.guest_email,
        shippingAddressId: orderData.shipping_address_id,
        shippingAddress: orderData.shipping_address,
        paymentMethod: orderData.payment_method,
        status: orderData.status,
        subtotal: orderData.subtotal.toString(),
        shippingCost: orderData.shipping_cost.toString(),
        discount: orderData.discount.toString(),
        loyaltyDiscount: orderData.loyalty_discount.toString(),
        loyaltyPointsUsed: orderData.loyalty_points_used,
        total: orderData.total.toString(),
        couponCode: orderData.coupon_code,
        notes: orderData.notes,
      })
      .returning();

    if (!row) {
      throw new Error('checkout.errors.orderFailed');
    }

    return transformOrder(row);
  } catch (error) {
    throw error;
  }
}

export async function createOrderItems(
  items: Omit<OrderItem, 'id' | 'created_at'>[],
): Promise<OrderItem[]> {
  if (!items.length) {
    return [];
  }

  try {
    const rows = await db
      .insert(orderItems)
      .values(
        items.map((item) => ({
          orderId: item.order_id,
          productId: item.product_id,
          productSnapshot: item.product_snapshot,
          quantity: item.quantity,
          unitPrice: item.unit_price.toString(),
          subtotal: item.subtotal.toString(),
        })),
      )
      .returning();

    if (!rows.length) {
      throw new Error('checkout.errors.orderFailed');
    }

    return rows.map(transformOrderItem);
  } catch (error) {
    throw error;
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    return row ? transformOrder(row) : null;
  } catch (error) {
    console.error('Failed to get order by id', error);
    return null;
  }
}

export async function getOrderByOrderNumber(orderNumber: string): Promise<Order | null> {
  try {
    const [row] = await db
      .select()
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    return row ? transformOrder(row) : null;
  } catch (error) {
    console.error('Failed to get order by order_number', error);
    return null;
  }
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  try {
    const rows = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    return rows.map(transformOrderItem);
  } catch (error) {
    console.error('Failed to get order items', error);
    return [];
  }
}

export async function getOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
  const order = await getOrderById(orderId);
  if (!order) {
    return null;
  }

  const items = await getOrderItems(order.id);
  return {
    ...order,
    items,
  };
}

export async function getUserOrders(userId: string, limit: number = 10): Promise<Order[]> {
  try {
    const rows = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(limit);

    return rows.map(transformOrder);
  } catch (error) {
    console.error('Failed to fetch user orders', error);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  try {
    await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}
