import type { BlogCategory } from '@/types';
import type { IconName } from '@/components/ui';

export const BLOG_CATEGORIES: Array<{
  key: BlogCategory;
  icon: IconName;
  color: string;
}> = [
  { key: 'filter-guide', icon: 'filter', color: 'aqua-500' },
  { key: 'plant-care', icon: 'sparkles', color: 'green-500' },
  { key: 'fish-compatibility', icon: 'droplet', color: 'coral-500' },
  { key: 'setup-tips', icon: 'settings', color: 'sand-500' },
];

export const POSTS_PER_PAGE = 9;

export const RELATED_POSTS_COUNT = 3;

export const CONTENT_DIR = 'src/content/blog';

export const MAX_EXCERPT_LENGTH = 200;

export const DEFAULT_COVER_IMAGE = '/images/blog/default-cover.jpg';

export const READING_SPEED = 200;
