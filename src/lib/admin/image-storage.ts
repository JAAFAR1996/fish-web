import 'server-only';

import { deleteFile, deleteFiles } from '@/lib/storage/r2';

import { PRODUCT_IMAGES_BUCKET } from './constants';

const extractPathFromUrl = (url: string): string | null => {
  const marker = `${PRODUCT_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return url.replace(/^\/+/, '') || null;
  }

  return url.slice(index + marker.length);
};

export async function deleteProductImage(imageUrl: string): Promise<void> {
  const path = extractPathFromUrl(imageUrl);

  if (!path) {
    return;
  }

  try {
    await deleteFile(PRODUCT_IMAGES_BUCKET, path);
  } catch (error) {
    console.error('[Admin] Failed to delete product image', {
      imageUrl,
      path,
      error,
    });
  }
}

export async function deleteProductImages(imageUrls: string[]): Promise<void> {
  const paths = imageUrls
    .map(extractPathFromUrl)
    .filter((path): path is string => Boolean(path));

  if (!paths.length) {
    return;
  }

  try {
    await deleteFiles(PRODUCT_IMAGES_BUCKET, paths);
  } catch (error) {
    console.error('[Admin] Failed to delete product images', {
      imageUrls,
      paths,
      error,
    });
  }
}
