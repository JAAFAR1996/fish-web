import 'server-only';

import { deleteFile, deleteFiles } from '@/lib/storage/r2';

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
  if (index === -1) {
    const relative = url.replace(/^\/+/, '');
    return relative || null;
  }
  return url.slice(index + marker.length);
};

export async function deleteGalleryImage(imageUrl: string): Promise<void> {
  const path = extractGalleryPathFromUrl(imageUrl);
  if (!path) return;

  try {
    await deleteFile(GALLERY_IMAGES_BUCKET, path);
  } catch (error) {
    console.error('[Gallery] Failed to delete image:', {
      imageUrl,
      path,
      error,
    });
  }
}

export async function deleteGalleryImages(imageUrls: string[]): Promise<void> {
  const paths = imageUrls.map(extractGalleryPathFromUrl).filter((p): p is string => Boolean(p));
  if (!paths.length) return;

  try {
    await deleteFiles(GALLERY_IMAGES_BUCKET, paths);
  } catch (error) {
    console.error('[Gallery] Failed to delete images:', {
      imageUrls,
      paths,
      error,
    });
  }
}
