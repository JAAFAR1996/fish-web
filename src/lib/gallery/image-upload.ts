import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';

import {
  GALLERY_IMAGES_BUCKET,
} from './constants';

/**
 * This module contains server-only gallery image operations.
 * For client-side uploads, use @/lib/gallery/image-upload-client instead.
 * This module can only be imported in Server Components, Server Actions, or API Routes.
 */

const extractGalleryPathFromUrl = (url: string): string | null => {
  const marker = `${GALLERY_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return url.slice(index + marker.length);
};

export async function deleteGalleryImage(imageUrl: string): Promise<void> {
  const path = extractGalleryPathFromUrl(imageUrl);
  if (!path) return;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.storage.from(GALLERY_IMAGES_BUCKET).remove([path]);
  if (error) {
    console.error('Failed to delete gallery image', error);
  }
}

export async function deleteGalleryImages(imageUrls: string[]): Promise<void> {
  const paths = imageUrls.map(extractGalleryPathFromUrl).filter((p): p is string => Boolean(p));
  if (!paths.length) return;
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.storage.from(GALLERY_IMAGES_BUCKET).remove(paths);
  if (error) {
    console.error('Failed to delete gallery images', error);
  }
}
