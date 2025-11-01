import type { Product, ProductSpecifications } from '@/types';

export type SupabaseProductRow = Record<string, unknown>;

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
    const specs = value as Record<string, unknown>;
    const compatibility = specs.compatibility && typeof specs.compatibility === 'object'
      ? {
          minTankSize:
            typeof (specs.compatibility as Record<string, unknown>).minTankSize ===
            'number'
              ? (specs.compatibility as Record<string, unknown>).minTankSize
              : null,
          maxTankSize:
            typeof (specs.compatibility as Record<string, unknown>).maxTankSize ===
            'number'
              ? (specs.compatibility as Record<string, unknown>).maxTankSize
              : null,
          displayText: normalizeString(
            (specs.compatibility as Record<string, unknown>).displayText,
            ''
          ),
        }
      : DEFAULT_COMPATIBILITY;

    return {
      flow:
        typeof specs.flow === 'number'
          ? specs.flow
          : null,
      power:
        typeof specs.power === 'number'
          ? specs.power
          : null,
      compatibility,
      dimensions:
        specs.dimensions && typeof specs.dimensions === 'object'
          ? (specs.dimensions as ProductSpecifications['dimensions'])
          : null,
      weight:
        typeof specs.weight === 'number'
          ? specs.weight
          : null,
    };
  }

  return DEFAULT_SPECIFICATIONS;
}

export function normalizeSupabaseProduct(row: SupabaseProductRow): Product {
  const specifications = normalizeSpecifications(row.specifications);
  const stock = normalizeNumber(row.stock);
  const createdAt = normalizeString(row.created_at ?? (row as any).createdAt ?? '');
  const updatedAt = normalizeString(row.updated_at ?? (row as any).updatedAt ?? '');

  return {
    id: normalizeString(row.id),
    slug: normalizeString(row.slug),
    name: normalizeString(row.name),
    brand: normalizeString(row.brand),
    category: normalizeString(row.category),
    subcategory: normalizeString(row.subcategory),
    description: normalizeString(row.description),
    price: normalizeNumber(row.price),
    originalPrice:
      normalizeOptionalNumber((row as any).originalPrice ?? (row as any).original_price),
    currency: (normalizeString(row.currency, 'IQD') || 'IQD') as Product['currency'],
    images: normalizeArray<string>(row.images),
    thumbnail:
      normalizeString(
        (row as any).thumbnail ??
          (Array.isArray(row.images) && row.images.length > 0
            ? (row.images as any[])[0]
            : '')
      ) || '',
    rating: normalizeNumber(row.rating),
    reviewCount: normalizeNumber((row as any).reviewCount ?? (row as any).review_count),
    stock,
    lowStockThreshold: normalizeNumber(
      (row as any).lowStockThreshold ?? (row as any).low_stock_threshold
    ),
    inStock: normalizeBoolean((row as any).inStock ?? (row as any).in_stock, stock > 0),
    isNew: normalizeBoolean((row as any).isNew ?? (row as any).is_new),
    isBestSeller: normalizeBoolean((row as any).isBestSeller ?? (row as any).is_best_seller),
    specifications,
    created_at: createdAt || undefined,
    updated_at: updatedAt || undefined,
  };
}
