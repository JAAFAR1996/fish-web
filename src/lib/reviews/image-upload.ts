import 'server-only';

import { deleteFile, deleteFiles } from '@/lib/storage/r2';

import { STORAGE_BUCKET } from './constants';

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

  try {
    await deleteFile(STORAGE_BUCKET, filePath);
  } catch (error) {
    console.error('[Reviews] Failed to delete review image', {
      imageUrl,
      filePath,
      error,
    });
  }
}

export async function deleteReviewImages(imageUrls: string[]): Promise<void> {
  const paths = imageUrls
    .map(extractPathFromUrl)
    .filter((path): path is string => Boolean(path));

  if (!paths.length) {
    return;
  }

  try {
    await deleteFiles(STORAGE_BUCKET, paths);
  } catch (error) {
    console.error('[Reviews] Failed to delete review images', {
      imageUrls,
      paths,
      error,
    });
  }
}
