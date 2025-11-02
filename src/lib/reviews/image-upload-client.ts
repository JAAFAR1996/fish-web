import { getSupabaseUrl } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';

import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  STORAGE_BUCKET,
} from './constants';

const sanitizeFileName = (fileName: string): string =>
  fileName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '');

export { extractPathFromUrl } from './url-utils';

export async function uploadReviewImage(
  file: File,
  userId: string,
  reviewId: string,
): Promise<{ url: string | null; error?: string }> {
  if (file.size > MAX_IMAGE_SIZE) {
    return { url: null, error: 'reviews.validation.imageSizeMax' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return { url: null, error: 'reviews.validation.imageTypeInvalid' };
  }

  const supabase = createClient();
  const sanitizedName = sanitizeFileName(file.name) || 'image';
  const filePath = `${userId}/${reviewId}/${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Failed to upload review image', uploadError);
    return { url: null, error: 'reviews.errors.uploadFailed' };
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return { url: data.publicUrl };
}

export async function uploadReviewImages(
  files: File[],
  userId: string,
  reviewId: string,
): Promise<{
  results: Array<{ url: string | null; error?: string }>;
  urls: string[];
  errors: string[];
}> {
  if (!files.length) {
    return { results: [], urls: [], errors: [] };
  }

  const results = await Promise.all(
    files.map((file) => uploadReviewImage(file, userId, reviewId)),
  );

  const urls = results
    .map((result) => result.url)
    .filter((url): url is string => Boolean(url));
  const errors = results
    .map((result) => result.error)
    .filter((message): message is string => Boolean(message));

  return { results, urls, errors };
}

export const getImageUrl = (filePath: string): string => {
  const baseUrl = getSupabaseUrl().replace(/\/+$/, '');
  const cleanPath = filePath.replace(/^\/+/, '');

  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanPath}`;
};

export async function optimizeImage(file: File): Promise<File> {
  return file;
}
