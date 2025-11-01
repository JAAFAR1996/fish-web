'use server';

import { revalidatePath } from 'next/cache';

import type {
  CartItemWithProduct,
  CheckoutData,
  Locale,
  Order,
  OrderItem,
  OrderWithItems,
} from '@/types';

import { getUser } from '@/lib/auth/utils';
import { getProductsWithFlashSales } from '@/lib/data/products';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { adminClient } from '@/lib/supabase/admin';
import {
  clearUserCart,
  getUserCart,
  mapCartItemsWithProducts,
} from '@/lib/cart/cart-queries';

import { sendOrderConfirmationEmail } from '@/lib/email/send-order-confirmation';
import { createNotificationAction } from '@/lib/notifications/notification-actions';
import type { OrderNotificationData } from '@/types';

import { calculateShippingCost, formatDeliveryEstimate } from './shipping-rates';
import { validateCoupon, calculateDiscount, incrementCouponUsage } from './coupon-utils';
import { calculateOrderTotals, generateOrderNumber, mapCartItemsToOrderItems, validateOrderData } from './order-utils';
import { createOrder, createOrderItems } from './order-queries';
import { validateCheckoutData, validateCouponCode } from './validation';
import { getEffectiveUnitPrice } from '@/lib/marketing/flash-sales-helpers';
import {
  calculatePointsDiscount,
  calculatePointsEarned,
  getUserPointsBalance,
  redeemPoints,
  awardPoints,
  validatePointsRedemption,
} from '@/lib/marketing/loyalty-utils';

type CheckoutItemInput = {
  productId: string;
  quantity: number;
};

type ExtendedCheckoutData = CheckoutData & {
  items?: CheckoutItemInput[];
  locale?: Locale;
  shippingAddressId?: string | null;
  loyaltyPoints?: number;
};

function getLocale(data: ExtendedCheckoutData, fallback: Locale = 'en'): Locale {
  if (data.locale === 'ar' || data.locale === 'en') {
    return data.locale;
  }
  return fallback;
}

async function getGuestCartItems(
  items: CheckoutItemInput[] | undefined
): Promise<{ items: CartItemWithProduct[]; subtotal: number } | null> {
  if (!items || items.length === 0) {
    return null;
  }

  const products = await getProductsWithFlashSales();
  const now = new Date().toISOString();

  const cartItems: CartItemWithProduct[] = [];
  let subtotal = 0;

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product || item.quantity <= 0 || item.quantity > product.stock) {
      return null;
    }

    const unitPrice = getEffectiveUnitPrice(product);

    subtotal += unitPrice * item.quantity;

    cartItems.push({
      id: `guest-${product.id}`,
      cart_id: 'guest',
      product_id: product.id,
      quantity: item.quantity,
      unit_price: unitPrice,
      created_at: now,
      updated_at: now,
      product,
    });
  }

  return { items: cartItems, subtotal };
}

async function getAuthenticatedCartItems(
  userId: string
): Promise<{ items: CartItemWithProduct[]; subtotal: number; cartId: string } | null> {
  const cart = await getUserCart(userId);
  if (!cart) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  const { data: rawItems, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id);

  if (error || !rawItems?.length) {
    return null;
  }

  const products = await getProductsWithFlashSales();
  const items = await mapCartItemsWithProducts(rawItems, products);
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * (item.unit_price ?? item.product.price),
    0
  );

  return { items, subtotal, cartId: cart.id };
}

export async function applyCouponAction(
  code: string,
  subtotal: number
): Promise<{
  success: boolean;
  discount?: number;
  error?: string;
  params?: Record<string, string | number>;
}> {
  const validation = validateCouponCode(code);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.errors.coupon ?? 'checkout.coupon.invalidCode',
    };
  }

  const result = await validateCoupon(code, subtotal);
  if (!result.valid) {
    return { success: false, error: result.error, params: result.params };
  }

  const discount = calculateDiscount(result.coupon, subtotal);
  return {
    success: true,
    discount,
  };
}

export async function createOrderAction(
  data: ExtendedCheckoutData
): Promise<{
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  error?: string;
  params?: Record<string, string | number>;
}> {
  const user = await getUser();
  const isGuest = !user;
  const locale = getLocale(data, 'en');
  const requestedLoyaltyPoints = user ? Math.max(0, data.loyaltyPoints ?? 0) : 0;
  let loyaltyDiscount = 0;

  const validation = validateCheckoutData(data, isGuest);
  if (!validation.valid) {
    const firstError = Object.values(validation.errors)[0] ?? 'checkout.errors.orderFailed';
    return { success: false, error: firstError };
  }

  let cartItemsWithProducts: CartItemWithProduct[] = [];
  let subtotal = 0;
  let authCartId: string | null = null;

  if (user) {
    const cartResult = await getAuthenticatedCartItems(user.id);
    if (!cartResult) {
      return { success: false, error: 'checkout.errors.emptyCart' };
    }
    cartItemsWithProducts = cartResult.items;
    subtotal = cartResult.subtotal;
    authCartId = cartResult.cartId;
  } else {
    const guestCart = await getGuestCartItems(data.items);
    if (!guestCart) {
      return { success: false, error: 'checkout.errors.emptyCart' };
    }
    cartItemsWithProducts = guestCart.items;
    subtotal = guestCart.subtotal;
  }

  const orderValidation = validateOrderData({
    items: cartItemsWithProducts,
    shippingAddress: data.shippingAddress,
    paymentMethod: data.paymentMethod,
    subtotal,
  });

  if (!orderValidation.valid) {
    const firstError = orderValidation.errors[0] ?? 'checkout.errors.orderFailed';
    return { success: false, error: firstError };
  }

  let discount = 0;
  let appliedCouponId: string | null = null;

  if (data.couponCode) {
    const couponResult = await validateCoupon(data.couponCode, subtotal);
    if (!couponResult.valid) {
      return {
        success: false,
        error: couponResult.error,
        params: couponResult.params,
      };
    }
    discount = calculateDiscount(couponResult.coupon, subtotal);
    appliedCouponId = couponResult.coupon.id;
  }

  if (requestedLoyaltyPoints > 0 && user) {
    const balance = await getUserPointsBalance(user.id);
    const remainingSubtotal = Math.max(0, subtotal - discount);
    const loyaltyValidation = validatePointsRedemption(
      requestedLoyaltyPoints,
      balance,
      remainingSubtotal
    );

    if (!loyaltyValidation.valid) {
      return {
        success: false,
        error: loyaltyValidation.error ?? 'loyalty.redemptionFailed',
      };
    }

    loyaltyDiscount = Math.min(
      calculatePointsDiscount(requestedLoyaltyPoints),
      remainingSubtotal
    );
  }

  const shippingCost = calculateShippingCost(
    data.shippingAddress.governorate,
    subtotal
  );

  const totals = calculateOrderTotals(subtotal, shippingCost, discount, loyaltyDiscount);
  const baseOrderInput = {
    user_id: user?.id ?? null,
    guest_email: data.guestEmail ?? null,
    shipping_address_id: data.shippingAddressId ?? null,
    shipping_address: data.shippingAddress,
    payment_method: data.paymentMethod,
    status: 'pending' as const,
    subtotal: totals.subtotal,
    shipping_cost: totals.shipping,
    discount: totals.discount,
    loyalty_discount: totals.loyaltyDiscount,
    loyalty_points_used: requestedLoyaltyPoints,
    total: totals.total,
    coupon_code: data.couponCode ?? null,
    notes: data.notes ?? null,
  };

  try {
    let order: Order | null = null;
    let attemptError: unknown = null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const generatedOrderNumber = generateOrderNumber();

      try {
        order = await createOrder({
          ...baseOrderInput,
          order_number: generatedOrderNumber,
        });
        break;
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        const message = (error as Error)?.message ?? '';

        if (
          code === '23505' ||
          message.includes('orders_order_number_key') ||
          message.includes('duplicate key value')
        ) {
          attemptError = error;
          continue;
        }

        throw error;
      }
    }

    if (!order) {
      console.error('Failed to create order after retries', attemptError);
      return { success: false, error: 'checkout.errors.orderFailed' };
    }

    const orderItemsPayload = mapCartItemsToOrderItems(cartItemsWithProducts, order.id);
    const orderItems = await createOrderItems(orderItemsPayload);

    if (authCartId) {
      const supabase = await createServerSupabaseClient();
      await supabase
        .from('carts')
        .update({ status: 'converted' })
        .eq('id', authCartId);
      await clearUserCart(authCartId);
    }

    if (appliedCouponId) {
      const usageIncremented = await incrementCouponUsage(appliedCouponId);
      if (!usageIncremented) {
        console.warn('Failed to increment coupon usage after order creation', {
          couponId: appliedCouponId,
          orderId: order.id,
        });
      }
    }

    if (user) {
      const redemptionDescription =
        locale === 'ar'
          ? `استبدال النقاط للطلب ${order.order_number}`
          : `Redeemed points for order ${order.order_number}`;

      if (requestedLoyaltyPoints > 0 && totals.loyaltyDiscount > 0) {
        await redeemPoints(user.id, requestedLoyaltyPoints, order.id, redemptionDescription);
      }

      const earnableAmount = Math.max(0, subtotal - discount - totals.loyaltyDiscount);
      const pointsEarned = calculatePointsEarned(earnableAmount);

      if (pointsEarned > 0) {
        const earningDescription =
          locale === 'ar'
            ? `نقاط مكتسبة من الطلب ${order.order_number}`
            : `Points earned from order ${order.order_number}`;
        await awardPoints(user.id, pointsEarned, order.id, earningDescription);
      }
    }

    const deliveryEstimate = formatDeliveryEstimate(
      data.shippingAddress.governorate,
      locale
    );
    await sendOrderConfirmationEmail(order, orderItems, locale, deliveryEstimate);

    // Create in-app notification for authenticated users
    if (user) {
      const notificationData: OrderNotificationData = {
        type: 'order_confirmation',
        order_id: order.id,
        order_number: order.order_number,
        total: order.total,
        items_count: orderItems.length,
      };

      await createNotificationAction(
        user.id,
        'order_confirmation',
        locale === 'ar' ? `تم تأكيد طلبك ${order.order_number}` : `Order Confirmed ${order.order_number}`,
        locale === 'ar'
          ? `شكراً لطلبك! سنقوم بمعالجة طلبك وإرساله قريباً.`
          : `Thank you for your order! We'll process and ship it soon.`,
        notificationData,
        `/${locale}/account/orders/${order.order_number}`
      );
    }

    revalidatePath(`/${locale}/cart`);
    if (user) {
      revalidatePath(`/${locale}/account`);
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    };
  } catch (error) {
    console.error('Failed to create order', error);
    return { success: false, error: 'checkout.errors.orderFailed' };
  }
}

export async function getOrderForConfirmation(
  orderNumber: string
): Promise<OrderWithItems | null> {
  if (!orderNumber) {
    return null;
  }

  const { data: order, error } = await adminClient
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .maybeSingle<Order>();

  if (error || !order) {
    if (error) {
      console.error('Failed to fetch order for confirmation', error);
    }
    return null;
  }

  const { data: items, error: itemsError } = await adminClient
    .from('order_items')
    .select('*')
    .eq('order_id', order.id);

  if (itemsError) {
    console.error('Failed to fetch order items for confirmation', itemsError);
    return null;
  }

  return {
    ...(order as Order),
    items: (items ?? []) as OrderItem[],
  };
}
