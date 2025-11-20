import {
  ALLOWED_GALLERY_IMAGE_TYPES,
  GALLERY_IMAGES_BUCKET,
  MAX_GALLERY_IMAGE_SIZE,
} from './constants';
import { sanitizeFileName } from '@/lib/uploads/sanitize';

export const extractGalleryPathFromUrl = (url: string): string | null => {
  const marker = `${GALLERY_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) {
    const relative = url.replace(/^\/+/, '');
    return relative || null;
  }
  return url.slice(index + marker.length);
};

export async function uploadGalleryImage(
  file: File,
  userId: string,
  setupId: string,
): Promise<{ url: string | null; error?: string }> {
  if (file.size > MAX_GALLERY_IMAGE_SIZE) {
    return { url: null, error: 'gallery.validation.maxMedia' };
  }
  if (!ALLOWED_GALLERY_IMAGE_TYPES.includes(file.type as typeof ALLOWED_GALLERY_IMAGE_TYPES[number])) {
    return { url: null, error: 'gallery.validation.mediaRequired' };
  }

  const sanitizedName = sanitizeFileName(file.name) || 'media';
  const formData = new FormData();
  formData.append('file', file, sanitizedName);
  formData.append('userId', userId);
  formData.append('setupId', setupId);

  try {
    const response = await fetch('/api/upload/gallery', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      return {
        url: null,
        error: errorBody.error ?? 'gallery.errors.createFailed',
      };
    }

    const data = await response.json();
    return { url: data.url as string };
  } catch (error) {
    console.error('Failed to upload gallery image', error);
    return { url: null, error: 'gallery.errors.createFailed' };
  }
}

export async function uploadGalleryImages(
  files: File[],
  userId: string,
  setupId: string,
): Promise<{ results: Array<{ url: string | null; error?: string }>; urls: string[]; errors: string[] }> {
  if (!files.length) return { results: [], urls: [], errors: [] };
  const results = await Promise.all(files.map((f) => uploadGalleryImage(f, userId, setupId)));
  const urls = results.map((r) => r.url).filter((u): u is string => Boolean(u));
  const errors = results.map((r) => r.error).filter((e): e is string => Boolean(e));
  return { results, urls, errors };
}
