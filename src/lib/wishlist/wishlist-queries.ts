import type { Wishlist } from '@/types';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function getUserWishlist(userId: string): Promise<Wishlist[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('wishlists')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch wishlist', error);
    return [];
  }

  return (data as Wishlist[]) ?? [];
}

export async function addToWishlist(
  userId: string,
  productId: string
): Promise<Wishlist | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('wishlists')
    .insert({ user_id: userId, product_id: productId })
    .select()
    .single();

  if (error) {
    console.error('Failed to add to wishlist', error);
    return null;
  }

  return data as Wishlist;
}

export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId);

  if (error) {
    console.error('Failed to remove from wishlist', error);
  }
}

export async function isInWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle();

  return Boolean(data);
}

export async function clearUserWishlist(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('wishlists')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to clear wishlist', error);
  }
}

export async function getWishlistCount(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { count } = await supabase
    .from('wishlists')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  return count ?? 0;
}
