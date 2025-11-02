import { createServerSupabaseClient } from '@/lib/supabase/server';

import { PRODUCT_IMAGES_BUCKET } from './constants';

const extractPathFromUrl = (url: string): string | null => {
  const marker = `${PRODUCT_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);

  if (index === -1) {
    return null;
  }

  return url.slice(index + marker.length);
};

export async function deleteProductImage(imageUrl: string): Promise<void> {
  const path = extractPathFromUrl(imageUrl);

  if (!path) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([path]);

  if (error) {
    console.error('Failed to delete product image', error);
  }
}

export async function deleteProductImages(imageUrls: string[]): Promise<void> {
  const paths = imageUrls
    .map(extractPathFromUrl)
    .filter((path): path is string => Boolean(path));

  if (!paths.length) {
    return;
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove(paths);

  if (error) {
    console.error('Failed to delete product images', error);
  }
}
