'use server';

import { revalidatePath } from 'next/cache';

import type { LocalStorageWishlistItem } from '@/types';

import { getUser } from '@/lib/auth/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';

import {
  addToWishlist,
  clearUserWishlist,
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

  const locale = (user.user_metadata?.locale as string) ?? 'en';

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
  const locale = (user.user_metadata?.locale as string) ?? 'en';
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

  const locale = (user.user_metadata?.locale as string) ?? 'en';
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

  const locale = (user.user_metadata?.locale as string) ?? 'en';

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
  const locale = (user.user_metadata?.locale as string) ?? 'en';
  revalidatePath('/wishlist');
  revalidatePath(`/${locale}/wishlist`);
  return { success: true };
}

export async function createNotifyMeRequestAction(
  productId: string,
  email?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser();
  const supabase = await createServerSupabaseClient();

  const trimmedEmail = email?.trim();

  if (!user && !trimmedEmail) {
    return { success: false, error: 'wishlist.notifyMe.error' };
  }

  const payload = {
    product_id: productId,
    email: user ? null : trimmedEmail,
    user_id: user?.id ?? null,
  };

  const { error } = await supabase
    .from('notify_me_requests')
    .insert(payload);

  if (error) {
    if (error.code === '23505') {
      return { success: true };
    }

    console.error('Failed to create notify me request', error);
    return { success: false, error: 'wishlist.notifyMe.error' };
  }

  return { success: true };
}
