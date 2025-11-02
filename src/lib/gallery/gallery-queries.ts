import { createServerSupabaseClient } from '@/lib/supabase/server';
import { TANK_SIZE_RANGES } from './constants';
import type {
  GalleryFilters,
  GallerySetup,
  GallerySetupWithProducts,
  GallerySetupWithUser,
  Product,
} from '@/types';

export async function getGallerySetups(options?: {
  isApproved?: boolean;
  style?: string;
  tankSizeRange?: keyof typeof TANK_SIZE_RANGES | 'all';
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<GallerySetupWithUser[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('gallery_setups')
    .select('*, user:profiles_public(id, full_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (options?.isApproved !== undefined) {
    query = query.eq('is_approved', options.isApproved);
  } else {
    query = query.eq('is_approved', true);
  }

  if (options?.style) {
    query = query.eq('style', options.style);
  }

  const range = options?.tankSizeRange;
  if (range && range !== 'all') {
    const { min, max } = TANK_SIZE_RANGES[range];
    query = query.gte('tank_size', min).lte('tank_size', max);
  }

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (typeof options?.limit === 'number') {
    const from = options.offset ?? 0;
    const to = from + options.limit - 1;
    query = query.range(from, to);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Failed to fetch gallery setups', error);
    return [];
  }

  return (data ?? []) as unknown as GallerySetupWithUser[];
}

export async function getSetupById(id: string): Promise<GallerySetupWithUser | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('gallery_setups')
    .select('*, user:profiles_public(id, full_name, avatar_url)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('Failed to fetch gallery setup by id', error);
    return null;
  }

  return (data as unknown as GallerySetupWithUser) ?? null;
}

export async function getUserSetups(userId: string): Promise<GallerySetupWithUser[]> {
  return getGallerySetups({ userId, isApproved: undefined });
}

export async function getFeaturedSetups(limit = 8): Promise<GallerySetupWithUser[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('gallery_setups')
    .select('*, user:profiles_public(id, full_name, avatar_url)')
    .eq('is_approved', true)
    .eq('featured', true)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch featured setups', error);
    return [];
  }
  return (data ?? []) as unknown as GallerySetupWithUser[];
}

export async function getRelatedSetups(
  setup: GallerySetup,
  limit = 4,
): Promise<GallerySetupWithUser[]> {
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from('gallery_setups')
    .select('*, user:profiles_public(id, full_name, avatar_url)')
    .eq('is_approved', true)
    .neq('id', setup.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (setup.style) {
    query = query.eq('style', setup.style);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Failed to fetch related setups', error);
    return [];
  }

  return (data ?? []) as unknown as GallerySetupWithUser[];
}

export async function getGalleryStats(): Promise<{
  total: number;
  approved: number;
  featured: number;
}> {
  const supabase = await createServerSupabaseClient();

  const [{ count: total }, { count: approved }, { count: featured }] = await Promise.all([
    supabase.from('gallery_setups').select('id', { count: 'exact', head: true }),
    supabase
      .from('gallery_setups')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', true),
    supabase
      .from('gallery_setups')
      .select('id', { count: 'exact', head: true })
      .eq('featured', true),
  ]);

  return {
    total: total ?? 0,
    approved: approved ?? 0,
    featured: featured ?? 0,
  };
}
