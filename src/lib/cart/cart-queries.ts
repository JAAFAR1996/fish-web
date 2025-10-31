import type {
  Cart,
  CartItem,
  CartItemWithProduct,
  CartWithItems,
  LocalStorageCartItem,
  Product,
} from '@/types';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isFlashSaleActive } from '@/lib/marketing/flash-sales-helpers';

export async function getUserCart(userId: string): Promise<Cart | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch cart', error);
    return null;
  }

  return data ?? null;
}

export async function getCartWithItems(
  userId: string
): Promise<CartWithItems | null> {
  const supabase = await createServerSupabaseClient();
  const cart = await getUserCart(userId);

  if (!cart) {
    return null;
  }

  const { data: items, error } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', cart.id);

  if (error) {
    console.error('Failed to fetch cart items', error);
    return { ...cart, items: [], total: 0 };
  }

  const total = (items ?? []).reduce(
    (sum, item) => sum + item.quantity * item.unit_price,
    0
  );

  return {
    ...cart,
    items: (items ?? []) as CartItem[],
    total,
  };
}

export async function createCart(userId: string): Promise<Cart> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('carts')
    .insert({
      user_id: userId,
      status: 'active',
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create cart');
  }

  return data;
}

export async function upsertCartItem(
  cartId: string,
  productId: string,
  quantity: number,
  unitPrice: number
): Promise<CartItem> {
  const supabase = await createServerSupabaseClient();

  if (quantity <= 0) {
    await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId)
      .eq('product_id', productId);

    return {
      id: '',
      cart_id: cartId,
      product_id: productId,
      quantity: 0,
      unit_price: unitPrice,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('cart_items')
    .upsert(
      {
        cart_id: cartId,
        product_id: productId,
        quantity,
        unit_price: unitPrice,
      },
      { onConflict: 'cart_id,product_id' }
    )
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to upsert cart item');
  }

  return data;
}

export async function removeCartItem(
  cartId: string,
  productId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId)
    .eq('product_id', productId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function clearUserCart(cartId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('cart_id', cartId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncGuestCartToSupabase(
  userId: string,
  guestItems: LocalStorageCartItem[],
  products: Product[]
): Promise<void> {
  if (guestItems.length === 0) return;

  const supabase = await createServerSupabaseClient();

  let cart = await getUserCart(userId);
  if (!cart) {
    cart = await createCart(userId);
  }

  for (const item of guestItems) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    const flashSale = product.flashSale;
    const unitPrice = flashSale && isFlashSaleActive(flashSale)
      ? flashSale.flash_price
      : product.price;

    // Fetch existing quantity to merge.
    const { data: existing } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', item.productId)
      .maybeSingle();

    const newQuantity = (existing?.quantity ?? 0) + item.quantity;

    await upsertCartItem(cart.id, item.productId, newQuantity, unitPrice);
  }
}

export async function mapCartItemsWithProducts(
  items: CartItem[],
  products: Product[]
): Promise<CartItemWithProduct[]> {
  return items
    .map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return null;
      }
      return {
        ...item,
        product,
      } as CartItemWithProduct;
    })
    .filter((value): value is CartItemWithProduct => value !== null);
}
