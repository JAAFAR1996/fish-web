import type {
  CartItemWithProduct,
  OrderItem,
  PaymentMethod,
  Product,
  ProductSnapshot,
  ShippingAddressSnapshot,
} from '@/types';

import { ORDER_NUMBER_PREFIX } from './constants';

function padNumber(num: number, size: number) {
  let value = String(num);
  while (value.length < size) {
    value = `0${value}`;
  }
  return value;
}

function createRandomSegment(length: number) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let segment = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * alphabet.length);
    segment += alphabet[index];
  }
  return segment;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = padNumber(now.getMonth() + 1, 2);
  const day = padNumber(now.getDate(), 2);
  const random = createRandomSegment(4);

  return `${ORDER_NUMBER_PREFIX}-${year}${month}${day}-${random}`;
}

export function createProductSnapshot(product: Product): ProductSnapshot {
  return {
    name: product.name,
    brand: product.brand,
    thumbnail: product.thumbnail,
    specifications: product.specifications,
  };
}

export function calculateOrderTotals(
  subtotal: number,
  shippingCost: number,
  discount: number,
  loyaltyDiscount: number = 0
) {
  const safeSubtotal = Math.max(0, subtotal);
  const safeShipping = Math.max(0, shippingCost);
  const safeDiscount = Math.max(0, discount);
  const safeLoyalty = Math.max(0, loyaltyDiscount);

  const combinedDiscount = Math.max(0, safeDiscount + safeLoyalty);
  const total = Math.max(0, safeSubtotal + safeShipping - combinedDiscount);

  return {
    subtotal: safeSubtotal,
    shipping: safeShipping,
    discount: safeDiscount,
    loyaltyDiscount: safeLoyalty,
    total,
  };
}

export function mapCartItemsToOrderItems(
  cartItems: CartItemWithProduct[],
  orderId: string
): Omit<OrderItem, 'id' | 'created_at'>[] {
  return cartItems.map((item) => {
    const unitPrice = item.unit_price ?? item.product.price;
    const snapshot = createProductSnapshot(item.product);

    return {
      order_id: orderId,
      product_id: item.product_id,
      product_snapshot: snapshot,
      quantity: item.quantity,
      unit_price: unitPrice,
      subtotal: item.quantity * unitPrice,
    };
  });
}

export function validateOrderData(data: {
  items: CartItemWithProduct[];
  shippingAddress: ShippingAddressSnapshot;
  paymentMethod: PaymentMethod | null;
  subtotal: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.items.length) {
    errors.push('checkout.errors.emptyCart');
  }

  if (
    !data.shippingAddress.recipient_name ||
    !data.shippingAddress.address_line1 ||
    !data.shippingAddress.city ||
    !data.shippingAddress.governorate
  ) {
    errors.push('checkout.validation.addressRequired');
  }

  if (!data.paymentMethod) {
    errors.push('checkout.validation.paymentRequired');
  }

  if (data.subtotal <= 0) {
    errors.push('checkout.errors.emptyCart');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
