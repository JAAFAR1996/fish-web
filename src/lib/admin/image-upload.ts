 'use client';

import { createClient } from '@/lib/supabase/client';

import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  MAX_PRODUCT_IMAGE_SIZE,
  PRODUCT_IMAGES_BUCKET,
} from './constants';

const sanitizeFileName = (fileName: string): string =>
  fileName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '');

export async function uploadProductImage(
  file: File,
  productSlug: string,
): Promise<{ url: string | null; error?: string }> {
  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    return { url: null, error: 'admin.validation.imageSizeMax' };
  }

  if (!ALLOWED_PRODUCT_IMAGE_TYPES.includes(file.type)) {
    return { url: null, error: 'admin.validation.imageTypeInvalid' };
  }

  const supabase = createClient();
  const sanitizedName = sanitizeFileName(file.name) || 'image';
  const filePath = `products/${productSlug}/${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Failed to upload product image', uploadError);
    return { url: null, error: 'errors.imageUploadFailed' };
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  return { url: data.publicUrl };
}
