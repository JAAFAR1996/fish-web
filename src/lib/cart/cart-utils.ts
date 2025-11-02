import type { CartItemWithProduct } from '@/types';

import {
  FREE_SHIPPING_THRESHOLD,
  MAX_QUANTITY,
  MIN_QUANTITY,
} from './constants';

export function calculateSubtotal(items: CartItemWithProduct[]): number {
  return items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
}

export function calculateShipping(subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  // Shipping is calculated at checkout based on delivery location.
  return 0;
}

export function calculateTotal(subtotal: number, shipping: number): number {
  return subtotal + shipping;
}

export function calculateFreeShippingProgress(subtotal: number): {
  remaining: number;
  percentage: number;
  qualified: boolean;
} {
  const qualified = subtotal >= FREE_SHIPPING_THRESHOLD;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const percentage = Math.min(
    100,
    Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  );

  return {
    remaining,
    percentage,
    qualified,
  };
}

export function validateQuantity(
  quantity: number,
  stock: number
): { valid: boolean; error?: string } {
  if (!Number.isFinite(quantity) || quantity < MIN_QUANTITY) {
    return {
      valid: false,
      error: 'cart.errors.invalidQuantity',
    };
  }

  if (quantity > MAX_QUANTITY) {
    return {
      valid: false,
      error: 'cart.item.maxQuantity',
    };
  }

  if (quantity > stock) {
    return {
      valid: false,
      error: 'cart.errors.quantityExceeded',
    };
  }

  return { valid: true };
}

export function getTotalItemCount(items: CartItemWithProduct[]): number {
  return items.reduce((count, item) => count + item.quantity, 0);
}

export function isCartEmpty(items: CartItemWithProduct[]): boolean {
  return items.length === 0;
}
