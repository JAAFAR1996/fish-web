import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';

import {
  STORAGE_BUCKET,
} from './constants';

/**
 * This module contains server-only review image operations.
 * For client-side uploads, use @/lib/reviews/image-upload-client instead.
 * This module can only be imported in Server Components, Server Actions, or API Routes.
 */

import { extractPathFromUrl } from './url-utils';

export async function deleteReviewImage(imageUrl: string): Promise<void> {
  const filePath = extractPathFromUrl(imageUrl);

  if (!filePath) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);

  if (error) {
    console.error('Failed to delete review image', error);
  }
}

export async function deleteReviewImages(imageUrls: string[]): Promise<void> {
  const paths = imageUrls
    .map(extractPathFromUrl)
    .filter((path): path is string => Boolean(path));

  if (!paths.length) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);

  if (error) {
    console.error('Failed to delete review images', error);
  }
}


