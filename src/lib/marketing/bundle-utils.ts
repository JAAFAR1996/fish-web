import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getProducts } from '@/lib/data/products';
import type { Bundle, BundleWithProducts, Product, CartItemWithProduct } from '@/types';

/**
 * Get all active bundles
 */
export async function getActiveBundles(): Promise<Bundle[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('bundles')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('[Bundles] Error fetching active bundles:', error);
    return [];
  }

  const now = new Date();

  return (data as Bundle[]).filter((bundle) => {
    const startsAt = bundle.starts_at ? new Date(bundle.starts_at) : null;
    const endsAt = bundle.ends_at ? new Date(bundle.ends_at) : null;

    if (startsAt && now < startsAt) {
      return false;
    }

    if (endsAt && now >= endsAt) {
      return false;
    }

    return true;
  });
}

/**
 * Get bundle by ID with products
 */
export async function getBundleById(bundleId: string): Promise<BundleWithProducts | null> {
  const supabase = await createServerSupabaseClient();

  const { data: bundle, error } = await supabase
    .from('bundles')
    .select('*')
    .eq('id', bundleId)
    .maybeSingle();

  if (error || !bundle) {
    console.error(`[Bundles] Error fetching bundle ${bundleId}:`, error);
    return null;
  }

  // Fetch all products and filter by bundle product IDs
  const allProducts = await getProducts();
  const bundleProducts = allProducts.filter(p => (bundle.product_ids as string[]).includes(p.id));

  // Calculate totals
  const totalOriginalPrice = bundleProducts.reduce(
    (sum, product) => sum + (product.originalPrice ?? product.price),
    0
  );
  const savings = totalOriginalPrice - bundle.bundle_price;

  return {
    ...bundle,
    product_ids: bundle.product_ids as string[],
    products: bundleProducts,
    totalOriginalPrice,
    savings,
  } as BundleWithProducts;
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
