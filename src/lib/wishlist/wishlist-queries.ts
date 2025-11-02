import type { Wishlist } from '@/types';

import { db } from '@server/db';
import { wishlists } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function getUserWishlist(userId: string): Promise<Wishlist[]> {
  const items = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, userId))
    .orderBy(desc(wishlists.createdAt));

  return items as unknown as Wishlist[];
}

export async function addToWishlist(
  userId: string,
  productId: string
): Promise<Wishlist | null> {
  try {
    const [item] = await db
      .insert(wishlists)
      .values({ userId, productId })
      .returning();

    return item as unknown as Wishlist;
  } catch (error) {
    console.error('Failed to add to wishlist', error);
    return null;
  }
}

export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<void> {
  try {
    await db
      .delete(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
  } catch (error) {
    console.error('Failed to remove from wishlist', error);
  }
}

export async function isInWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  const [item] = await db
    .select()
    .from(wishlists)
    .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)))
    .limit(1);

  return Boolean(item);
}

export async function clearUserWishlist(userId: string): Promise<void> {
  try {
    await db.delete(wishlists).where(eq(wishlists.userId, userId));
  } catch (error) {
    console.error('Failed to clear wishlist', error);
  }
}

export async function getWishlistCount(userId: string): Promise<number> {
  const items = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, userId));

  return items.length;
}
