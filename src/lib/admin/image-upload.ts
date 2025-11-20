'use client';

import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  MAX_PRODUCT_IMAGE_SIZE,
} from './constants';
import { sanitizeFileName } from '@/lib/uploads/sanitize';

export async function uploadProductImage(
  file: File,
  productSlug: string,
): Promise<{ url: string | null; error?: string }> {
  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    return { url: null, error: 'admin.validation.imageSizeMax' };
  }

  if (!ALLOWED_PRODUCT_IMAGE_TYPES.includes(file.type as typeof ALLOWED_PRODUCT_IMAGE_TYPES[number])) {
    return { url: null, error: 'admin.validation.imageTypeInvalid' };
  }

  const sanitizedName = sanitizeFileName(file.name) || 'image';
  const formData = new FormData();
  formData.append('file', file, sanitizedName);
  formData.append('slug', productSlug);

  try {
    const response = await fetch('/api/upload/product', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        url: null,
        error: errorBody.error ?? 'errors.imageUploadFailed',
      };
    }

    const data = await response.json();
    return { url: data.url as string };
  } catch (error) {
    console.error('Failed to upload product image', error);
    return { url: null, error: 'errors.imageUploadFailed' };
  }
}
