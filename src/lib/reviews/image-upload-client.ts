import { getR2PublicUrl } from '@/lib/env';
import { sanitizeFileName } from '@/lib/uploads/sanitize';

import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  STORAGE_BUCKET,
} from './constants';

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

  const sanitizedName = sanitizeFileName(file.name) || 'image';
  const formData = new FormData();
  formData.append('file', file, sanitizedName);
  formData.append('userId', userId);
  formData.append('reviewId', reviewId);

  try {
    const response = await fetch('/api/upload/review', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        url: null,
        error: errorBody.error ?? 'reviews.errors.uploadFailed',
      };
    }

    const data = await response.json();
    return { url: data.url as string };
  } catch (error) {
    console.error('Failed to upload review image', error);
    return { url: null, error: 'reviews.errors.uploadFailed' };
  }
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
  const baseUrl = getR2PublicUrl().replace(/\/+$/, '');
  const cleanPath = filePath.replace(/^\/+/, '');

  return `${baseUrl}/${STORAGE_BUCKET}/${cleanPath}`;
};

export async function optimizeImage(file: File): Promise<File> {
  return file;
}
