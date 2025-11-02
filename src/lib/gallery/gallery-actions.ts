"use server";

import { revalidatePath } from 'next/cache';

import { routing } from '@/i18n/routing';
import { requireAdmin, requireUser } from '@/lib/auth/utils';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAuditLog } from '@/lib/admin/audit-utils';
import { AUDIT_ACTIONS, ENTITY_TYPES } from '@/lib/admin/constants';
import { deleteGalleryImages } from './image-upload';
import type { GalleryMedia, GalleryStyle, Hotspot } from '@/types';
import { GALLERY_STYLES, MAX_GALLERY_MEDIA, MAX_HOTSPOTS_PER_IMAGE, MIN_TITLE_LENGTH, MAX_TITLE_LENGTH, MIN_TANK_SIZE, MAX_TANK_SIZE } from './constants';

function revalidateGallery() {
  routing.locales.forEach((locale) => {
    revalidatePath(`/${locale}/gallery`, 'page');
  });
}

export async function createSetupAction(
  payload: {
    title: string;
    description: string;
    tankSize: number;
    style: string;
    mediaUrls: Array<string | GalleryMedia>;
    hotspots: Hotspot[];
  }
): Promise<{ success: boolean; error?: string; id?: string }> {
  const user = await requireUser();

  // Validate URL-based media submission
  const title = (payload.title ?? '').trim();
  if (title.length < MIN_TITLE_LENGTH || title.length > MAX_TITLE_LENGTH) {
    return { success: false, error: 'gallery.validation.titleRequired' };
  }
  if (payload.tankSize < MIN_TANK_SIZE || payload.tankSize > MAX_TANK_SIZE) {
    return { success: false, error: 'gallery.validation.tankSizeRequired' };
  }
  if (!GALLERY_STYLES.includes(payload.style as GalleryStyle)) {
    return { success: false, error: 'gallery.validation.styleRequired' };
  }
  if (!Array.isArray(payload.mediaUrls) || payload.mediaUrls.length < 1) {
    return { success: false, error: 'gallery.validation.mediaRequired' };
  }
  if (payload.mediaUrls.length > MAX_GALLERY_MEDIA) {
    return { success: false, error: 'gallery.validation.maxMedia' };
  }
  if (Array.isArray(payload.hotspots) && payload.hotspots.length > MAX_HOTSPOTS_PER_IMAGE) {
    return { success: false, error: 'gallery.validation.maxHotspots' };
  }

  const supabase = await createServerSupabaseClient();
  const insertPayload = {
    user_id: user.id,
    title: payload.title.trim(),
    description: payload.description?.trim() || null,
    tank_size: payload.tankSize,
    style: payload.style,
    media_urls: payload.mediaUrls,
    hotspots: payload.hotspots,
    is_approved: false,
    featured: false,
  };

  const { data, error } = await supabase
    .from('gallery_setups')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error || !data) {
    console.error('Failed to create gallery setup', error);
    return { success: false, error: 'gallery.errors.createFailed' };
  }

  try {
    await createAuditLog(
      user.id,
      AUDIT_ACTIONS.GALLERY_SETUP_CREATED,
      ENTITY_TYPES.GALLERY_SETUP,
      data.id,
      { after: insertPayload }
    );
  } catch {}

  revalidateGallery();
  return { success: true, id: data.id };
}

export async function updateSetupAction(
  id: string,
  payload: Partial<{
    title: string;
    description: string;
    tankSize: number;
    style: string;
    mediaUrls: Array<string | GalleryMedia>;
    hotspots: Hotspot[];
  }>
): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from('gallery_setups')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: 'gallery.errors.notFound' };
  }

  if (existing.user_id !== user.id) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  const updates: Record<string, unknown> = {};
  if (payload.title !== undefined) updates.title = payload.title.trim();
  if (payload.description !== undefined) updates.description = payload.description?.trim() || null;
  if (payload.tankSize !== undefined) updates.tank_size = payload.tankSize;
  if (payload.style !== undefined) updates.style = payload.style;
  if (payload.hotspots !== undefined) updates.hotspots = payload.hotspots;
  if (payload.mediaUrls !== undefined) updates.media_urls = payload.mediaUrls;

  const { error: updateError } = await supabase
    .from('gallery_setups')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    console.error('Failed to update gallery setup', updateError);
    return { success: false, error: 'gallery.errors.updateFailed' };
  }

  revalidateGallery();
  return { success: true };
}

export async function deleteSetupAction(id: string, imageUrls: string[]): Promise<{ success: boolean; error?: string }> {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: fetchError } = await supabase
    .from('gallery_setups')
    .select('user_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !existing) {
    return { success: false, error: 'gallery.errors.notFound' };
  }

  if (existing.user_id !== user.id) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  if (Array.isArray(imageUrls) && imageUrls.length) {
    await deleteGalleryImages(imageUrls);
  }

  const { error } = await supabase.from('gallery_setups').delete().eq('id', id);
  if (error) {
    console.error('Failed to delete gallery setup', error);
    return { success: false, error: 'gallery.errors.deleteFailed' };
  }

  revalidateGallery();
  return { success: true };
}

export async function incrementViewCountAction(id: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.rpc('increment_gallery_view_count', { p_id: id });
}

export async function approveSetupAction(id: string, approved: boolean): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('gallery_setups')
    .update({ is_approved: approved })
    .eq('id', id);

  if (error) {
    return { success: false, error: 'gallery.errors.updateFailed' };
  }

  try {
    await createAuditLog(admin.id, AUDIT_ACTIONS.GALLERY_SETUP_APPROVED, ENTITY_TYPES.GALLERY_SETUP, id, { approved });
  } catch {}

  revalidateGallery();
  return { success: true };
}

export async function featureSetupAction(id: string, featured: boolean): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdmin();
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from('gallery_setups')
    .update({ featured })
    .eq('id', id);

  if (error) {
    return { success: false, error: 'gallery.errors.updateFailed' };
  }

  try {
    await createAuditLog(admin.id, AUDIT_ACTIONS.GALLERY_SETUP_FEATURED, ENTITY_TYPES.GALLERY_SETUP, id, { featured });
  } catch {}

  revalidateGallery();
  return { success: true };
}
