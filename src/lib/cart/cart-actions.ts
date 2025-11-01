'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

import type { CartWithItems, LocalStorageCartItem } from '@/types';

import { getProductsWithFlashSales } from '@/lib/data/products';
import { getUser } from '@/lib/auth/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { routing } from '@/i18n/routing';
import { logError } from '@/lib/logger';
import { getEffectiveUnitPrice } from '@/lib/marketing/flash-sales-helpers';
import {
  clearUserCart,
  createCart,
  getCartWithItems,
  getUserCart,
  removeCartItem,
  syncGuestCartToSupabase,
  upsertCartItem,
} from './cart-queries';
import { validateQuantity } from './cart-utils';

function revalidateCart(locale: string | null | undefined) {
  if (locale) {
    revalidatePath(`/${locale}/cart`);
    return;
  }

  routing.locales.forEach((loc) => {
    revalidatePath(`/${loc}/cart`);
  });
}

function resolveRequestId(): string | null {
  try {
    const headerList = headers();
    return (
      headerList.get('x-request-id') ??
      headerList.get('x-correlation-id') ??
      headerList.get('x-vercel-id') ??
      headerList.get('x-amzn-trace-id') ??
      null
    );
  } catch {
    return null;
  }
}

function logCartActionError(
  action: string,
  context: { userId: string | null } & Record<string, unknown>,
  error: unknown
) {
  const requestId = resolveRequestId();
  const errorMessage =
    error instanceof Error ? error.message : (typeof error === 'string' ? error : 'Unknown error');

  logError('Cart action failed', {
    action,
    ...context,
    requestId,
    errorMessage,
    errorStack: error instanceof Error ? error.stack : undefined,
  });
}

export async function addToCartAction(
  productId: string,
  quantity: number = 1
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  const products = await getProductsWithFlashSales();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return { success: false, error: 'cart.errors.updateFailed' };
  }

  const unitPrice = getEffectiveUnitPrice(product);

  const validation = validateQuantity(quantity, product.stock);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  let cart = await getUserCart(user.id);
  if (!cart) {
    cart = await createCart(user.id);
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .maybeSingle();

    const newQuantity = (existingItem?.quantity ?? 0) + quantity;
    const finalValidation = validateQuantity(newQuantity, product.stock);
    if (!finalValidation.valid) {
      return { success: false, error: finalValidation.error };
    }

    await upsertCartItem(cart.id, productId, newQuantity, unitPrice);
    revalidateCart(user.user_metadata?.locale);
    return { success: true };
  } catch (error) {
    logCartActionError(
      'addToCart',
      { userId: user.id, productId, quantity },
      error
    );
    return { success: false, error: 'cart.errors.updateFailed' };
  }
}

export async function removeFromCartAction(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  const cart = await getUserCart(user.id);
  if (!cart) {
    return { success: true };
  }

  try {
    await removeCartItem(cart.id, productId);
    revalidateCart(user.user_metadata?.locale);
    return { success: true };
  } catch (error) {
    logCartActionError(
      'removeFromCart',
      { userId: user.id, productId },
      error
    );
    return { success: false, error: 'cart.errors.updateFailed' };
  }
}

export async function updateQuantityAction(
  productId: string,
  quantity: number
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  const products = await getProductsWithFlashSales();
  const product = products.find((p) => p.id === productId);

  if (!product) {
    return { success: false, error: 'cart.errors.updateFailed' };
  }

  const validation = validateQuantity(quantity, product.stock);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const cart = await getUserCart(user.id);
  if (!cart) {
    return { success: false, error: 'cart.errors.updateFailed' };
  }

  const unitPrice = getEffectiveUnitPrice(product);

  try {
    await upsertCartItem(cart.id, productId, quantity, unitPrice);
    revalidateCart(user.user_metadata?.locale);
    return { success: true };
  } catch (error) {
    logCartActionError(
      'updateQuantity',
      { userId: user.id, productId, quantity },
      error
    );
    return { success: false, error: 'cart.errors.updateFailed' };
  }
}

export async function clearCartAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  const cart = await getUserCart(user.id);
  if (!cart) {
    return { success: true };
  }

  try {
    await clearUserCart(cart.id);
    revalidateCart(user.user_metadata?.locale);
    return { success: true };
  } catch (error) {
    logCartActionError(
      'clearCart',
      { userId: user.id },
      error
    );
    return { success: false, error: 'cart.errors.updateFailed' };
  }
}

export async function syncGuestCartAction(
  guestItems: LocalStorageCartItem[]
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  if (!guestItems.length) {
    return { success: true };
  }

  const products = await getProductsWithFlashSales();

  try {
    await syncGuestCartToSupabase(user.id, guestItems, products);
    revalidateCart(user.user_metadata?.locale);
    return { success: true };
  } catch (error) {
    logCartActionError(
      'syncGuestCart',
      { userId: user.id, guestItemCount: guestItems.length },
      error
    );
    return { success: false, error: 'cart.errors.updateFailed' };
  }
}

export async function getServerCartForUser(): Promise<CartWithItems | null> {
  const user = await getUser();
  if (!user) {
    return null;
  }

  return getCartWithItems(user.id);
}


