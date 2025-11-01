import type {
  Cart,
  CartItem,
  CartItemWithProduct,
  CartWithItems,
  LocalStorageCartItem,
  Product,
} from '@/types';

import { db } from '@server/db';
import { carts, cartItems } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { getEffectiveUnitPrice } from '@/lib/marketing/flash-sales-helpers';

export async function getUserCart(userId: string): Promise<Cart | null> {
  const [cart] = await db
    .select()
    .from(carts)
    .where(and(eq(carts.userId, userId), eq(carts.status, 'active')))
    .limit(1);

  return cart ? (cart as unknown as Cart) : null;
}

export async function getCartWithItems(
  userId: string
): Promise<CartWithItems | null> {
  const cart = await getUserCart(userId);

  if (!cart) {
    return null;
  }

  const items = await db
    .select()
    .from(cartItems)
    .where(eq(cartItems.cartId, cart.id));

  const total = items.reduce(
    (sum, item) => sum + item.quantity * Number(item.unitPrice),
    0
  );

  return {
    ...cart,
    items: items as unknown as CartItem[],
    total,
  };
}

export async function createCart(userId: string): Promise<Cart> {
  const [cart] = await db
    .insert(carts)
    .values({
      userId,
      status: 'active',
    })
    .returning();

  if (!cart) {
    throw new Error('Failed to create cart');
  }

  return cart as unknown as Cart;
}

export async function upsertCartItem(
  cartId: string,
  productId: string,
  quantity: number,
  unitPrice: number
): Promise<CartItem> {
  if (quantity <= 0) {
    await db
      .delete(cartItems)
      .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));

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

  const [item] = await db
    .insert(cartItems)
    .values({
      cartId,
      productId,
      quantity,
      unitPrice: unitPrice.toString(),
    })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId],
      set: {
        quantity,
        unitPrice: unitPrice.toString(),
      },
    })
    .returning();

  if (!item) {
    throw new Error('Failed to upsert cart item');
  }

  return item as unknown as CartItem;
}

export async function removeCartItem(
  cartId: string,
  productId: string
): Promise<void> {
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)));
}

export async function clearUserCart(cartId: string): Promise<void> {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
}

export async function syncGuestCartToSupabase(
  userId: string,
  guestItems: LocalStorageCartItem[],
  products: Product[]
): Promise<void> {
  if (guestItems.length === 0) return;

  let cart = await getUserCart(userId);
  if (!cart) {
    cart = await createCart(userId);
  }

  for (const item of guestItems) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) continue;
    const unitPrice = getEffectiveUnitPrice(product);

    const [existing] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, item.productId)))
      .limit(1);

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
