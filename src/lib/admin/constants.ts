export const PRODUCT_IMAGES_BUCKET = 'product-images';
export const MAX_PRODUCT_IMAGES = 5;
export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_PRODUCT_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const PRODUCTS_PER_PAGE = 20;
export const ORDERS_PER_PAGE = 20;
export const USERS_PER_PAGE = 20;
export const AUDIT_LOGS_PER_PAGE = 50;

export const LOW_STOCK_MULTIPLIER = 1.5;
export const CRITICAL_STOCK_THRESHOLD = 0;

export const DEFAULT_REPORT_DAYS = 30;
export const MAX_REPORT_DAYS = 365;
export const CHART_COLORS = ['#0E8FA8', '#B89968', '#FF6F61', '#10B981', '#F59E0B'];

export const AUDIT_ACTIONS = {
  PRODUCT_CREATED: 'product_created',
  PRODUCT_UPDATED: 'product_updated',
  PRODUCT_DELETED: 'product_deleted',
  ORDER_UPDATED: 'order_updated',
  REVIEW_APPROVED: 'review_approved',
  REVIEW_REJECTED: 'review_rejected',
  STOCK_UPDATED: 'stock_updated',
  GALLERY_SETUP_CREATED: 'gallery_setup_created',
  GALLERY_SETUP_APPROVED: 'gallery_setup_approved',
  GALLERY_SETUP_FEATURED: 'gallery_setup_featured',
} as const;

export const ENTITY_TYPES = {
  PRODUCT: 'product',
  ORDER: 'order',
  REVIEW: 'review',
  USER: 'user',
  FLASH_SALE: 'flash_sale',
  BUNDLE: 'bundle',
  COUPON: 'coupon',
  GALLERY_SETUP: 'gallery_setup',
} as const;
