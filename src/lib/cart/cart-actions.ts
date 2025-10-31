'use server';

import { revalidatePath } from 'next/cache';

import type { CartWithItems, LocalStorageCartItem } from '@/types';

import { getProductsWithFlashSales } from '@/lib/data/products';
import { getUser } from '@/lib/auth/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';
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
import { isFlashSaleActive } from '@/lib/marketing/flash-sales-helpers';

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

  const flashSale = product.flashSale;
  const unitPrice = flashSale && isFlashSaleActive(flashSale)
    ? flashSale.flash_price
    : product.price;

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
    revalidatePath(`/${user.user_metadata?.locale ?? 'en'}/cart`);
    return { success: true };
  } catch (error) {
    console.error('Failed to add to cart', error);
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
    revalidatePath(`/${user.user_metadata?.locale ?? 'en'}/cart`);
    return { success: true };
  } catch (error) {
    console.error('Failed to remove cart item', error);
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

  const flashSale = product.flashSale;
  const unitPrice = flashSale && isFlashSaleActive(flashSale)
    ? flashSale.flash_price
    : product.price;

  try {
    await upsertCartItem(cart.id, productId, quantity, unitPrice);
    revalidatePath(`/${user.user_metadata?.locale ?? 'en'}/cart`);
    return { success: true };
  } catch (error) {
    console.error('Failed to update cart quantity', error);
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
    revalidatePath(`/${user.user_metadata?.locale ?? 'en'}/cart`);
    return { success: true };
  } catch (error) {
    console.error('Failed to clear cart', error);
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
    revalidatePath(`/${user.user_metadata?.locale ?? 'en'}/cart`);
    return { success: true };
  } catch (error) {
    console.error('Failed to sync guest cart', error);
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


