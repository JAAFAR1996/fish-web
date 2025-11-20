'use server';

import { revalidatePath } from 'next/cache';

import type { LocalStorageWishlistItem, Wishlist } from '@/types';

import { getUser } from '@/lib/auth/utils';
import { db } from '@server/db';
import { notifyMeRequests } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

import {
  addToWishlist,
  clearUserWishlist,
  getUserWishlist,
  isInWishlist,
  removeFromWishlist,
} from './wishlist-queries';

export async function addToWishlistAction(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  const locale = 'en';

  const exists = await isInWishlist(user.id, productId);
  if (exists) {
    return { success: true };
  }

  await addToWishlist(user.id, productId);

  revalidatePath('/wishlist');
  revalidatePath(`/${locale}/wishlist`);
  return { success: true };
}

export async function removeFromWishlistAction(
  productId: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  await removeFromWishlist(user.id, productId);
  const locale = 'en';
  revalidatePath('/wishlist');
  revalidatePath(`/${locale}/wishlist`);
  return { success: true };
}

export async function toggleWishlistAction(
  productId: string
): Promise<{ success: boolean; added: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, added: false, error: 'auth.errors.unauthenticated' };
  }

  const locale = 'en';
  const exists = await isInWishlist(user.id, productId);

  if (exists) {
    await removeFromWishlist(user.id, productId);
    revalidatePath('/wishlist');
    revalidatePath(`/${locale}/wishlist`);
    return { success: true, added: false };
  }

  await addToWishlist(user.id, productId);
  revalidatePath('/wishlist');
  revalidatePath(`/${locale}/wishlist`);
  return { success: true, added: true };
}

export async function syncGuestWishlistAction(
  guestItems: LocalStorageWishlistItem[]
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  if (!guestItems.length) {
    return { success: true };
  }

  const locale = 'en';

  for (const item of guestItems) {
    const alreadyExists = await isInWishlist(user.id, item.productId);
    if (alreadyExists) {
      continue;
    }
    await addToWishlist(user.id, item.productId);
  }

  revalidatePath('/wishlist');
  revalidatePath(`/${locale}/wishlist`);
  return { success: true };
}

export async function clearWishlistAction(): Promise<{
  success: boolean;
  error?: string;
}> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  await clearUserWishlist(user.id);
  const locale = 'en';
  revalidatePath('/wishlist');
  revalidatePath(`/${locale}/wishlist`);
  return { success: true };
}

export async function createNotifyMeRequestAction(
  productId: string,
  email?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();

  const trimmedEmail = email?.trim();

  if (!user && !trimmedEmail) {
    return { success: false, error: 'wishlist.notifyMe.error' };
  }

  try {
    let existing: Array<{ id: string }> = [];

    if (user) {
      existing = await db
        .select({ id: notifyMeRequests.id })
        .from(notifyMeRequests)
        .where(
          and(
            eq(notifyMeRequests.productId, productId),
            eq(notifyMeRequests.userId, user.id)
          )
        )
        .limit(1);
    } else if (trimmedEmail) {
      existing = await db
        .select({ id: notifyMeRequests.id })
        .from(notifyMeRequests)
        .where(
          and(
            eq(notifyMeRequests.productId, productId),
            eq(notifyMeRequests.email, trimmedEmail)
          )
        )
        .limit(1);
    }

    if (existing.length > 0) {
      return { success: true };
    }

    await db.insert(notifyMeRequests).values({
      productId,
      email: user ? null : trimmedEmail ?? null,
      userId: user?.id ?? null,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to create notify me request', error);
    return { success: false, error: 'wishlist.notifyMe.error' };
  }
}

export async function getWishlistItemsAction(): Promise<Wishlist[]> {
  const user = await getUser();

  if (!user) {
    return [];
  }

  return getUserWishlist(user.id);
}
