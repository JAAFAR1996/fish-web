import { db } from '@server/db';
import { bundles } from '@shared/schema';
import { and, eq, gte, isNull, lte, or, sql } from 'drizzle-orm';

import { getProducts } from '@/lib/data/products';
import type { Bundle, BundleWithProducts, Product, CartItemWithProduct } from '@/types';

const toIsoString = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : value ?? new Date(0).toISOString();

type BundleRow = typeof bundles.$inferSelect;

function transformBundle(row: BundleRow): Bundle {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    product_ids: Array.isArray(row.productIds) ? (row.productIds as string[]) : [],
    discount_type: row.discountType as Bundle['discount_type'],
    discount_value: Number.parseFloat(String(row.discountValue ?? 0)),
    bundle_price: Number.parseFloat(String(row.bundlePrice ?? 0)),
    is_active: row.isActive,
    starts_at: row.startsAt ? toIsoString(row.startsAt) : null,
    ends_at: row.endsAt ? toIsoString(row.endsAt) : null,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  };
}

/**
 * Get all active bundles
 */
export async function getActiveBundles(): Promise<Bundle[]> {
  try {
    const now = new Date();

    const rows = await db
      .select()
      .from(bundles)
      .where(
        and(
          eq(bundles.isActive, true),
          or(isNull(bundles.startsAt), lte(bundles.startsAt, now)),
          or(isNull(bundles.endsAt), gte(bundles.endsAt, now))
        )
      );

    return rows.map(transformBundle);
  } catch (error) {
    console.error('[Bundles] Error fetching active bundles:', error);
    return [];
  }
}

/**
 * Get bundle by ID with products
 */
export async function getBundleById(bundleId: string): Promise<BundleWithProducts | null> {
  try {
    const [row] = await db
      .select()
      .from(bundles)
      .where(eq(bundles.id, bundleId))
      .limit(1);

    if (!row) {
      return null;
    }

    const bundle = transformBundle(row);

    // Fetch all products and filter by bundle product IDs
    const allProducts = await getProducts();
    const bundleProducts = allProducts.filter((product) =>
      bundle.product_ids.includes(product.id),
    );

    // Calculate totals
    const totalOriginalPrice = bundleProducts.reduce(
      (sum, product) => sum + (product.originalPrice ?? product.price),
      0,
    );
    const savings = totalOriginalPrice - bundle.bundle_price;

    return {
      ...bundle,
      products: bundleProducts,
      totalOriginalPrice,
      savings,
    } as BundleWithProducts;
  } catch (error) {
    console.error(`[Bundles] Error fetching bundle ${bundleId}:`, error);
    return null;
  }
}

/**
 * Validate if all bundle products are in cart
 */
export function validateBundleInCart(
  cartItems: CartItemWithProduct[],
  bundle: Bundle
): { valid: boolean; missingProducts: string[] } {
  const cartProductIds = cartItems.map(item => item.product_id);
  const bundleProductIds = bundle.product_ids as string[];
  const missingProducts = bundleProductIds.filter(id => !cartProductIds.includes(id));

  return {
    valid: missingProducts.length === 0,
    missingProducts,
  };
}

/**
 * Calculate bundle discount amount
 */
export function calculateBundleDiscount(bundle: Bundle, products: Product[]): number {
  const bundleProductIds = bundle.product_ids as string[];
  const bundleProducts = products.filter(p => bundleProductIds.includes(p.id));
  const totalOriginalPrice = bundleProducts.reduce(
    (sum, product) => sum + (product.originalPrice ?? product.price),
    0
  );

  if (bundle.discount_type === 'percentage') {
    return (totalOriginalPrice * bundle.discount_value) / 100;
  }

  return bundle.discount_value;
}

/**
 * Detect which bundles are applicable to current cart
 */
export async function detectBundlesInCart(
  cartItems: CartItemWithProduct[]
): Promise<Array<{ bundle: Bundle; discount: number }>> {
  const bundles = await getActiveBundles();
  const applicableBundles: Array<{ bundle: Bundle; discount: number }> = [];
  const allProducts = await getProducts();

  for (const bundle of bundles) {
    const validation = validateBundleInCart(cartItems, bundle);
    if (validation.valid) {
      const discount = calculateBundleDiscount(bundle, allProducts);
      applicableBundles.push({ bundle, discount });
    }
  }

  return applicableBundles;
}

/**
 * Check if all bundle products are in stock
 */
export function areBundleProductsInStock(
  bundle: BundleWithProducts,
  requestedQuantity: number = 1
): boolean {
  return bundle.products.every(product => product.stock >= requestedQuantity);
}
