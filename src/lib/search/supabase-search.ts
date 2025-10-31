import type { Locale, Product, ProductSpecifications } from '@/types';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type SupabaseProductRow = Record<string, unknown>;

const DEFAULT_COMPATIBILITY = {
  minTankSize: null,
  maxTankSize: null,
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
  const createdAt = normalizeString(row.created_at ?? row.createdAt ?? '');
  const updatedAt = normalizeString(row.updated_at ?? row.updatedAt ?? '');

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
      normalizeOptionalNumber(row.originalPrice ?? row.original_price),
    currency: (normalizeString(row.currency, 'IQD') || 'IQD') as Product['currency'],
    images: normalizeArray<string>(row.images),
    thumbnail:
      normalizeString(
        row.thumbnail ??
          (Array.isArray(row.images) && row.images.length > 0
            ? row.images[0]
            : '')
      ) || '',
    rating: normalizeNumber(row.rating),
    reviewCount: normalizeNumber(row.reviewCount ?? row.review_count),
    stock,
    lowStockThreshold: normalizeNumber(
      row.lowStockThreshold ?? row.low_stock_threshold
    ),
    inStock: normalizeBoolean(row.inStock ?? row.in_stock, stock > 0),
    isNew: normalizeBoolean(row.isNew ?? row.is_new),
    isBestSeller: normalizeBoolean(row.isBestSeller ?? row.is_best_seller),
    specifications,
    created_at: createdAt || undefined,
    updated_at: updatedAt || undefined,
  };
}

export async function searchProductsSupabase(
  query: string,
  locale: Locale,
  limit?: number
): Promise<Product[]> {
  const supabase = await createServerSupabaseClient();

  const config = locale === 'ar' ? 'arabic' : 'english';
  const requestedLimit = limit ?? 50;

  const { data, error } = await supabase
    .from('products')
    .select(
      `
        id,
        slug,
        name,
        brand,
        category,
        subcategory,
        description,
        price,
        original_price,
        currency,
        images,
        thumbnail,
        rating,
        review_count,
        stock,
        low_stock_threshold,
        in_stock,
        is_new,
        is_best_seller,
        specifications
      `
    )
    .textSearch('search_vector', query, {
      type: 'websearch',
      config,
    })
    .limit(requestedLimit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(normalizeSupabaseProduct);
}
