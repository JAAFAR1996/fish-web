import { getSupabaseUrl } from '@/lib/env';
import { createClient } from '@/lib/supabase/client';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

export const extractPathFromUrl = (url: string): string | null => {
  const marker = `${STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return url.slice(index + marker.length);
};

export async function uploadReviewImage(
  file: File,
  userId: string,
  reviewId: string,
): Promise<{ url: string | null; error?: string }> {
  if (file.size > MAX_IMAGE_SIZE) {
    return { url: null, error: 'reviews.validation.imageSizeMax' };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
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

export const getImageUrl = (filePath: string): string => {
  const baseUrl = getSupabaseUrl().replace(/\/+$/, '');
  const cleanPath = filePath.replace(/^\/+/, '');

  return `${baseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanPath}`;
};

export async function optimizeImage(file: File): Promise<File> {
  return file;
}
