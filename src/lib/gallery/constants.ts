export const GALLERY_IMAGES_BUCKET = 'gallery-images';
export const MAX_GALLERY_MEDIA = 5;
export const MAX_GALLERY_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_GALLERY_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
] as const;

export const MAX_HOTSPOTS_PER_IMAGE = 10;
export const HOTSPOT_SIZE_PX = 32;
export const SETUPS_PER_PAGE = 12;
export const RELATED_SETUPS_COUNT = 4;

export const TANK_SIZE_RANGES: Record<
  'nano' | 'small' | 'medium' | 'large',
  { min: number; max: number }
> = {
  nano: { min: 0, max: 40 },
  small: { min: 41, max: 120 },
  medium: { min: 121, max: 250 },
  large: { min: 251, max: 10000 },
};

export const GALLERY_STYLES = [
  'planted',
  'reef',
  'community',
  'biotope',
  'nano',
  'other',
] as const;

export const STYLE_COLORS: Record<string, string> = {
  planted: 'bg-emerald-500 text-white',
  reef: 'bg-sky-500 text-white',
  community: 'bg-violet-500 text-white',
  biotope: 'bg-amber-500 text-white',
  nano: 'bg-pink-500 text-white',
  other: 'bg-gray-500 text-white',
};

export const STYLE_ICONS: Record<string, string> = {
  planted: 'leaf',
  reef: 'waves',
  community: 'users',
  biotope: 'globe',
  nano: 'sparkles',
  other: 'tag',
};

export const MIN_TITLE_LENGTH = 5;
export const MAX_TITLE_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MIN_TANK_SIZE = 1;
export const MAX_TANK_SIZE = 10_000;
