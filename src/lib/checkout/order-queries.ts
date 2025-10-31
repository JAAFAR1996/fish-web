import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderWithItems,
  PaymentMethod,
  ShippingAddressSnapshot,
} from '@/types';

import { createServerSupabaseClient } from '@/lib/supabase/server';

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

export async function createOrder(orderData: CreateOrderInput): Promise<Order> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .insert(orderData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('checkout.errors.orderFailed');
  }

  return data as Order;
}

export async function createOrderItems(
  orderItems: Omit<OrderItem, 'id' | 'created_at'>[]
): Promise<OrderItem[]> {
  if (!orderItems.length) {
    return [];
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('order_items')
    .insert(orderItems)
    .select();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('checkout.errors.orderFailed');
  }

  return data as OrderItem[];
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

  if (error) {
    console.error('Failed to get order by id', error);
    return null;
  }

  return (data as Order) ?? null;
}

export async function getOrderByOrderNumber(
  orderNumber: string
): Promise<Order | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .maybeSingle();

  if (error) {
    console.error('Failed to get order by order_number', error);
    return null;
  }

  return (data as Order) ?? null;
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (error) {
    console.error('Failed to get order items', error);
    return [];
  }

  return (data as OrderItem[]) ?? [];
}

export async function getOrderWithItems(
  orderId: string
): Promise<OrderWithItems | null> {
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

export async function getUserOrders(
  userId: string,
  limit: number = 10
): Promise<Order[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch user orders', error);
    return [];
  }

  return (data as Order[]) ?? [];
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }
}
