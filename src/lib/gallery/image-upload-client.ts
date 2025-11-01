import { createClient } from '@/lib/supabase/client';

import {
  ALLOWED_GALLERY_IMAGE_TYPES,
  GALLERY_IMAGES_BUCKET,
  MAX_GALLERY_IMAGE_SIZE,
} from './constants';

const sanitizeFileName = (fileName: string): string =>
  fileName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.\-_]/g, '');

export const extractGalleryPathFromUrl = (url: string): string | null => {
  const marker = `${GALLERY_IMAGES_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
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
  if (!ALLOWED_GALLERY_IMAGE_TYPES.includes(file.type as any)) {
    return { url: null, error: 'gallery.validation.mediaRequired' };
  }

  const supabase = createClient();
  const sanitizedName = sanitizeFileName(file.name) || 'media';
  const filePath = `${userId}/${setupId}/${Date.now()}-${sanitizedName}`;

  const { error: uploadError } = await supabase.storage
    .from(GALLERY_IMAGES_BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error('Failed to upload gallery image', uploadError);
    return { url: null, error: 'gallery.errors.createFailed' };
  }

  const { data } = supabase.storage
    .from(GALLERY_IMAGES_BUCKET)
    .getPublicUrl(filePath);

  return { url: data.publicUrl };
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
