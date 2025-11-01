import type { GalleryStyle, ValidationResult } from '@/types';
import {
  ALLOWED_GALLERY_IMAGE_TYPES,
  GALLERY_STYLES,
  MAX_GALLERY_IMAGE_SIZE,
  MAX_GALLERY_MEDIA,
  MAX_HOTSPOTS_PER_IMAGE,
  MAX_TANK_SIZE,
  MIN_TANK_SIZE,
  MIN_TITLE_LENGTH,
  MAX_TITLE_LENGTH,
} from './constants';

const result = (errors: Record<string, string>): ValidationResult => ({ valid: Object.keys(errors).length === 0, errors });

export function validateSetupTitle(title: string): ValidationResult {
  const trimmed = (title ?? '').trim();
  if (!trimmed || trimmed.length < MIN_TITLE_LENGTH) return result({ title: 'gallery.validation.titleRequired' });
  if (trimmed.length > MAX_TITLE_LENGTH) return result({ title: 'gallery.validation.titleRequired' });
  return result({});
}

export function validateTankSize(value: number): ValidationResult {
  if (!Number.isFinite(value)) return result({ tankSize: 'gallery.validation.tankSizeRequired' });
  if (value < MIN_TANK_SIZE || value > MAX_TANK_SIZE) return result({ tankSize: 'gallery.validation.tankSizeRequired' });
  return result({});
}

export function validateStyle(style: GalleryStyle): ValidationResult {
  const validStyles: readonly string[] = GALLERY_STYLES;
  if (!validStyles.includes(style)) return result({ style: 'gallery.validation.styleRequired' });
  return result({});
}

export function validateMedia(files: File[]): ValidationResult {
  if (!Array.isArray(files) || files.length === 0) return result({ media: 'gallery.validation.mediaRequired' });
  if (files.length > MAX_GALLERY_MEDIA) return result({ media: 'gallery.validation.maxMedia' });
  const allowedTypes: readonly string[] = ALLOWED_GALLERY_IMAGE_TYPES;
  for (const file of files) {
    if (file.size > MAX_GALLERY_IMAGE_SIZE) return result({ media: 'gallery.validation.maxMedia' });
    if (!allowedTypes.includes(file.type)) return result({ media: 'gallery.validation.mediaRequired' });
  }
  return result({});
}

export function validateHotspots(hotspots: Array<{ x: number; y: number; product_id: string }>): ValidationResult {
  if (!Array.isArray(hotspots)) return result({});
  if (hotspots.length > MAX_HOTSPOTS_PER_IMAGE) return result({ hotspots: 'gallery.validation.maxHotspots' });
  for (const h of hotspots) {
    if (h.x < 0 || h.x > 100 || h.y < 0 || h.y > 100 || !h.product_id) {
      return result({ hotspots: 'gallery.validation.maxHotspots' });
    }
  }
  return result({});
}

export function validateSetupForm(data: {
  title: string;
  description?: string;
  tankSize: number;
  style: GalleryStyle;
  media: File[];
  hotspots: Array<{ x: number; y: number; product_id: string }>;
}): ValidationResult {
  const titleResult = validateSetupTitle(data.title);
  const tankResult = validateTankSize(data.tankSize);
  const styleResult = validateStyle(data.style);
  const mediaResult = validateMedia(data.media);
  const hotspotsResult = validateHotspots(data.hotspots);

  const errors = {
    ...titleResult.errors,
    ...tankResult.errors,
    ...styleResult.errors,
    ...mediaResult.errors,
    ...hotspotsResult.errors,
  };

  return {
    valid: titleResult.valid && tankResult.valid && styleResult.valid && mediaResult.valid && hotspotsResult.valid,
    errors,
  };
}
