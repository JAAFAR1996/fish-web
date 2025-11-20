import type { Product, ProductSpecifications } from '@/types';

export interface SupabaseProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  rating: number;
  stock: number;
  specifications: ProductSpecifications | null;
  // Snake case variants
  created_at?: string | Date;
  updated_at?: string | Date;
  original_price?: number;
  review_count?: number;
  low_stock_threshold?: number;
  in_stock?: boolean;
  is_new?: boolean;
  is_best_seller?: boolean;
  // Camel case variants
  createdAt?: string | Date;
  updatedAt?: string | Date;
  originalPrice?: number;
  reviewCount?: number;
  lowStockThreshold?: number;
  inStock?: boolean;
  isNew?: boolean;
  isBestSeller?: boolean;
  thumbnail?: string;
}

const DEFAULT_COMPATIBILITY = {
  minTankSize: null as number | null,
  maxTankSize: null as number | null,
  displayText: '',
};

const DEFAULT_SPECIFICATIONS: ProductSpecifications = {
  flow: null,
  power: null,
  compatibility: DEFAULT_COMPATIBILITY,
  dimensions: null,
  weight: null,
};

function normalizeBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

function normalizeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function normalizeOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function normalizeArray<T>(value: unknown, fallback: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  return fallback;
}

function normalizeSpecifications(value: unknown): ProductSpecifications {
  if (value && typeof value === 'object') {
    const specs = value as { 
      compatibility?: { 
        minTankSize?: unknown;
        maxTankSize?: unknown;
        displayText?: unknown;
      };
      flow?: unknown;
      power?: unknown;
      dimensions?: unknown;
      weight?: unknown;
    };

    const compatibility = specs.compatibility && typeof specs.compatibility === 'object'
      ? {
          minTankSize: typeof specs.compatibility.minTankSize === 'number'
            ? specs.compatibility.minTankSize
            : null,
          maxTankSize: typeof specs.compatibility.maxTankSize === 'number'
            ? specs.compatibility.maxTankSize
            : null,
          displayText: normalizeString(specs.compatibility.displayText, ''),
        }
      : DEFAULT_COMPATIBILITY;

    return {
      flow: typeof specs.flow === 'number' ? specs.flow : null,
      power: typeof specs.power === 'number' ? specs.power : null,
      compatibility,
      dimensions: specs.dimensions && typeof specs.dimensions === 'object' && 
        'length' in specs.dimensions && typeof specs.dimensions.length === 'number' &&
        'width' in specs.dimensions && typeof specs.dimensions.width === 'number' &&
        'height' in specs.dimensions && typeof specs.dimensions.height === 'number'
          ? {
              length: specs.dimensions.length,
              width: specs.dimensions.width,
              height: specs.dimensions.height,
            }
          : null,
      weight: typeof specs.weight === 'number' ? specs.weight : null,
    };
  }

  return DEFAULT_SPECIFICATIONS;
}

export function normalizeSupabaseProduct(row: SupabaseProductRow): Product {
  const specifications = normalizeSpecifications(row.specifications);
  const stock = normalizeNumber(row.stock);

  const createdAtRaw = row.created_at ?? row.createdAt ?? null;
  const createdAtString =
    typeof createdAtRaw === 'string'
      ? createdAtRaw
      : createdAtRaw instanceof Date
        ? createdAtRaw.toISOString()
        : '';
  const createdAt = normalizeString(createdAtString);

  const updatedAtRaw = row.updated_at ?? row.updatedAt ?? null;
  const updatedAtString =
    typeof updatedAtRaw === 'string'
      ? updatedAtRaw
      : updatedAtRaw instanceof Date
        ? updatedAtRaw.toISOString()
        : '';
  const updatedAt = normalizeString(updatedAtString);

  return {
    id: normalizeString(row.id),
    slug: normalizeString(row.slug),
    name: normalizeString(row.name),
    brand: normalizeString(row.brand),
    category: normalizeString(row.category),
    subcategory: normalizeString(row.subcategory),
    description: normalizeString(row.description),
    price: normalizeNumber(row.price),
    originalPrice: normalizeOptionalNumber(row.originalPrice ?? row.original_price),
    currency: (normalizeString(row.currency, 'IQD') || 'IQD') as Product['currency'],
    images: normalizeArray<string>(row.images),
    thumbnail: normalizeString(
      row.thumbnail ??
        (Array.isArray(row.images) && row.images.length > 0 ? row.images[0] : '')
    ) || '',
    rating: normalizeNumber(row.rating),
    reviewCount: normalizeNumber(row.reviewCount ?? row.review_count),
    stock,
    lowStockThreshold: normalizeNumber(row.lowStockThreshold ?? row.low_stock_threshold),
    inStock: normalizeBoolean(row.inStock ?? row.in_stock, stock > 0),
    isNew: normalizeBoolean(row.isNew ?? row.is_new),
    isBestSeller: normalizeBoolean(row.isBestSeller ?? row.is_best_seller),
    specifications,
    created_at: createdAt || undefined,
    updated_at: updatedAt || undefined,
  };
}
