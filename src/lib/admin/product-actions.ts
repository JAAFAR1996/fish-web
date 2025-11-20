'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { eq, desc } from 'drizzle-orm';

import { db } from '@server/db';
import { products } from '@shared/schema';

import { slugify } from '@/lib/blog/content-utils';
import { requireAdmin } from '@/lib/auth/utils';
import { normalizeSupabaseProduct } from '@/lib/search/normalize';
import { triggerBackInStockAlerts } from '@/lib/notifications/trigger-stock-alerts';
import { routing } from '@/i18n/routing';
import { logError, logWarn, normalizeError } from '@/lib/logger';

import type { Product, ProductFormData } from '@/types';
import type { SupabaseProductRow } from '@/lib/search/normalize';

import { AUDIT_ACTIONS, ENTITY_TYPES } from './constants';
import { createAuditLog } from './audit-utils';
import { deleteProductImages } from './image-storage';
import { validateProductForm } from './validation';

interface ProductActionResult {
  success: boolean;
  error?: string;
  productId?: string;
}

const getFirstError = (errors: Record<string, string>): string | undefined =>
  Object.values(errors)[0];

const revalidateProductPaths = () => {
  routing.locales.forEach((locale) => {
    revalidatePath(`/${locale}/products`, 'page');
    revalidatePath(`/${locale}/admin`, 'page');
  });
  revalidateTag('products');
};

interface ProductInsertPayload {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  subcategory: string;
  description: string;
  price: number;
  original_price: number | null;
  currency: string;
  images: string[];
  thumbnail: string;
  rating: number;
  review_count: number;
  stock: number;
  low_stock_threshold: number | null;
  is_new: boolean;
  is_best_seller: boolean;
  specifications: Record<string, unknown>;
}

const normalizeSpecificationsForDb = (
  specifications: ProductFormData['specifications'],
): Record<string, unknown> => {
  if (!specifications) {
    return {};
  }

  try {
    return structuredClone(specifications) as unknown as Record<string, unknown>;
  } catch {
    return JSON.parse(JSON.stringify(specifications)) as unknown as Record<string, unknown>;
  }
};

const mapToDatabasePayload = (
  formData: ProductFormData,
  slug: string,
  productId: string,
  overrides: Partial<ProductInsertPayload> = {},
): ProductInsertPayload => {
  const imageUrls = (formData.images ?? []).map((url) => url.trim()).filter(Boolean);

  return {
    id: productId,
    slug,
    name: formData.name.trim(),
    brand: formData.brand.trim(),
    category: formData.category.trim(),
    subcategory: formData.subcategory.trim(),
    description: formData.description.trim(),
    price: formData.price,
    original_price: formData.originalPrice ?? null,
    currency: formData.currency ?? 'IQD',
    images: imageUrls,
    thumbnail: imageUrls[0] ?? '',
    rating: 0,
    review_count: 0,
    stock: formData.stock,
    low_stock_threshold: formData.lowStockThreshold ?? null,
    is_new: formData.isNew ?? false,
    is_best_seller: formData.isBestSeller ?? false,
    specifications: normalizeSpecificationsForDb(formData.specifications),
    ...overrides,
  };
};

export async function createProductAction(
  formData: ProductFormData,
): Promise<ProductActionResult> {
  const admin = await requireAdmin();
  const validation = validateProductForm(formData);

  if (!validation.valid) {
    return {
      success: false,
      error: getFirstError(validation.errors) ?? 'errors.productValidation',
    };
  }

  const slug = slugify(formData.name);
  const productId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Date.now().toString();

  const payload = mapToDatabasePayload(formData, slug, productId);
  const dbPayload = {
    id: payload.id,
    slug: payload.slug,
    name: payload.name,
    brand: payload.brand,
    category: payload.category,
    subcategory: payload.subcategory,
    description: payload.description,
    price: payload.price.toString(),
    originalPrice:
      payload.original_price !== null ? payload.original_price.toString() : null,
    currency: payload.currency,
    images: payload.images,
    thumbnail: payload.thumbnail,
    rating: payload.rating.toString(),
    reviewCount: payload.review_count,
    stock: payload.stock,
    lowStockThreshold: payload.low_stock_threshold ?? undefined,
    isNew: payload.is_new,
    isBestSeller: payload.is_best_seller,
    specifications: payload.specifications,
  };

  try {
    await db.insert(products).values(dbPayload);
  } catch (error) {
    const { errorMessage, errorStack } = normalizeError(error);
    logError('Failed to create product', {
      action: 'createProduct',
      adminId: admin.id,
      productId,
      errorMessage,
      errorStack,
    });
    return { success: false, error: 'errors.productCreateFailed' };
  }

  await createAuditLog(admin.id, AUDIT_ACTIONS.PRODUCT_CREATED, ENTITY_TYPES.PRODUCT, productId, {
    after: payload,
  });

  revalidateProductPaths();

  return { success: true, productId };
}

export async function updateProductAction(
  productId: string,
  formData: Partial<ProductFormData>,
): Promise<ProductActionResult> {
  const admin = await requireAdmin();
  const [existingProductRow] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!existingProductRow) {
    logError('Failed to fetch product for update', {
      action: 'updateProduct',
      adminId: admin.id,
      productId,
      errorMessage: 'Product not found',
      errorStack: undefined,
    });
    return { success: false, error: 'errors.productNotFound' };
  }

  const existingProduct = normalizeSupabaseProduct(
    existingProductRow as unknown as SupabaseProductRow,
  ) as Product;

  const mergedFormData: ProductFormData = {
    ...existingProduct,
    images: formData.images ?? (existingProduct.images ?? []),
  };

  Object.assign(mergedFormData, formData);
  if (!('images' in formData)) {
    mergedFormData.images = existingProduct.images ?? [];
  }

  const validation = validateProductForm(mergedFormData);
  if (!validation.valid) {
    return {
      success: false,
      error: getFirstError(validation.errors) ?? 'errors.productValidation',
    };
  }

  const updates: Record<string, unknown> = {};
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  const imagesToDelete: string[] = [];

  if (formData.name && formData.name !== existingProduct.name) {
    const newSlug = slugify(formData.name);
    updates.name = formData.name.trim();
    updates.slug = newSlug;
    changes.name = { before: existingProduct.name, after: formData.name.trim() };
    changes.slug = { before: existingProduct.slug, after: newSlug };
  }

  if (formData.brand && formData.brand !== existingProduct.brand) {
    updates.brand = formData.brand.trim();
    changes.brand = { before: existingProduct.brand, after: formData.brand.trim() };
  }

  if (formData.category && formData.category !== existingProduct.category) {
    updates.category = formData.category.trim();
    changes.category = {
      before: existingProduct.category,
      after: formData.category.trim(),
    };
  }

  if (formData.subcategory && formData.subcategory !== existingProduct.subcategory) {
    updates.subcategory = formData.subcategory.trim();
    changes.subcategory = {
      before: existingProduct.subcategory,
      after: formData.subcategory.trim(),
    };
  }

  if (formData.description && formData.description !== existingProduct.description) {
    updates.description = formData.description.trim();
    changes.description = {
      before: existingProduct.description,
      after: formData.description.trim(),
    };
  }

  if (typeof formData.price === 'number' && formData.price !== existingProduct.price) {
    updates.price = formData.price;
    changes.price = { before: existingProduct.price, after: formData.price };
  }

  if (
    formData.originalPrice !== undefined &&
    formData.originalPrice !== existingProduct.originalPrice
  ) {
    updates.original_price = formData.originalPrice;
    changes.original_price = {
      before: existingProduct.originalPrice,
      after: formData.originalPrice,
    };
  }

  if (typeof formData.stock === 'number' && formData.stock !== existingProduct.stock) {
    updates.stock = formData.stock;
    changes.stock = { before: existingProduct.stock, after: formData.stock };
  }

  if (
    typeof formData.lowStockThreshold === 'number' &&
    formData.lowStockThreshold !== existingProduct.lowStockThreshold
  ) {
    updates.low_stock_threshold = formData.lowStockThreshold;
    changes.low_stock_threshold = {
      before: existingProduct.lowStockThreshold,
      after: formData.lowStockThreshold,
    };
  }

  if (typeof formData.isNew === 'boolean' && formData.isNew !== existingProduct.isNew) {
    updates.is_new = formData.isNew;
    changes.is_new = { before: existingProduct.isNew, after: formData.isNew };
  }

  if (
    typeof formData.isBestSeller === 'boolean' &&
    formData.isBestSeller !== existingProduct.isBestSeller
  ) {
    updates.is_best_seller = formData.isBestSeller;
    changes.is_best_seller = {
      before: existingProduct.isBestSeller,
      after: formData.isBestSeller,
    };
  }

  if (formData.specifications) {
    updates.specifications = normalizeSpecificationsForDb(formData.specifications);
    changes.specifications = {
      before: existingProduct.specifications,
      after: formData.specifications,
    };
  }

  if (formData.images) {
    const sanitizedImages = formData.images.map((url) => url.trim()).filter(Boolean);
    const currentImages = Array.isArray(existingProductRow.images)
      ? (existingProductRow.images as string[])
      : [];

    const hasChanged =
      sanitizedImages.length !== currentImages.length ||
      sanitizedImages.some((url, index) => currentImages[index] !== url);

    if (hasChanged) {
      const removedImages = currentImages.filter((url) => !sanitizedImages.includes(url));
      if (removedImages.length) {
        imagesToDelete.push(...removedImages);
      }

      updates.images = sanitizedImages;
      updates.thumbnail = sanitizedImages[0] ?? existingProduct.thumbnail ?? '';
      changes.images = { before: existingProduct.images, after: sanitizedImages };
      changes.thumbnail = {
        before: existingProduct.thumbnail,
        after: updates.thumbnail,
      };
    }
  }

  if (Object.keys(updates).length === 0) {
    return { success: true };
  }

  const dbUpdates: Record<string, unknown> = {};
  Object.entries(updates).forEach(([key, value]) => {
    switch (key) {
      case 'price':
        dbUpdates.price = typeof value === 'number' ? value.toString() : value;
        break;
      case 'original_price':
        dbUpdates.originalPrice =
          value === null
            ? null
            : typeof value === 'number'
              ? value.toString()
              : value;
        break;
      case 'low_stock_threshold':
        dbUpdates.lowStockThreshold = value;
        break;
      case 'rating':
        dbUpdates.rating = typeof value === 'number' ? value.toString() : value;
        break;
      case 'is_new':
        dbUpdates.isNew = value;
        break;
      case 'is_best_seller':
        dbUpdates.isBestSeller = value;
        break;
      case 'review_count':
        dbUpdates.reviewCount = value;
        break;
      case 'specifications':
        dbUpdates.specifications = value;
        break;
      default:
        dbUpdates[key] = value;
    }
  });

  try {
    await db
      .update(products)
      .set(dbUpdates)
      .where(eq(products.id, productId));
  } catch (updateError) {
    const { errorMessage, errorStack } = normalizeError(updateError);
    logError('Failed to update product', {
      action: 'updateProduct',
      adminId: admin.id,
      productId,
      errorMessage,
      errorStack,
    });
    return { success: false, error: 'errors.productUpdateFailed' };
  }

  if (imagesToDelete.length) {
    try {
      await deleteProductImages(imagesToDelete);
    } catch (imageError) {
      const { errorMessage, errorStack } = normalizeError(imageError);
      logWarn('Failed to delete outdated product images', {
        action: 'updateProduct',
        adminId: admin.id,
        productId,
        images: imagesToDelete,
        errorMessage,
        errorStack,
      });
    }
  }

  await createAuditLog(admin.id, AUDIT_ACTIONS.PRODUCT_UPDATED, ENTITY_TYPES.PRODUCT, productId, {
    before: existingProductRow,
    changes,
  });

  revalidateProductPaths();

  return { success: true };
}

export async function deleteProductAction(productId: string): Promise<ProductActionResult> {
  const admin = await requireAdmin();
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!product) {
    logError('Failed to load product for deletion', {
      action: 'deleteProduct',
      adminId: admin.id,
      productId,
      errorMessage: 'Product not found',
      errorStack: undefined,
    });
    return { success: false, error: 'errors.productNotFound' };
  }

  if (Array.isArray(product.images) && product.images.length > 0) {
    await deleteProductImages(product.images as string[]);
  }

  try {
    await db.delete(products).where(eq(products.id, productId));
  } catch (error) {
    const { errorMessage, errorStack } = normalizeError(error);
    logError('Failed to delete product', {
      action: 'deleteProduct',
      adminId: admin.id,
      productId,
      errorMessage,
      errorStack,
    });
    return { success: false, error: 'errors.productDeleteFailed' };
  }

  await createAuditLog(admin.id, AUDIT_ACTIONS.PRODUCT_DELETED, ENTITY_TYPES.PRODUCT, productId, {
    before: product,
  });

  revalidateProductPaths();

  return { success: true };
}

export async function updateProductStockAction(
  productId: string,
  newStock: number,
): Promise<ProductActionResult> {
  const admin = await requireAdmin();
  const [productRow] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!productRow) {
    logError('Failed to load product for stock update', {
      action: 'updateProductStock',
      adminId: admin.id,
      productId,
      errorMessage: 'Product not found',
      errorStack: undefined,
    });
    return { success: false, error: 'errors.productNotFound' };
  }

  const prevStock = Number(productRow.stock ?? 0);

  try {
    await db
      .update(products)
      .set({ stock: newStock })
      .where(eq(products.id, productId));
  } catch (error) {
    const { errorMessage, errorStack } = normalizeError(error);
    logError('Failed to update product stock', {
      action: 'updateProductStock',
      adminId: admin.id,
      productId,
      errorMessage,
      errorStack,
    });
    return { success: false, error: 'errors.stockUpdateFailed' };
  }

  if (prevStock === 0 && newStock > 0) {
    try {
      const normalized = normalizeSupabaseProduct(
        productRow as unknown as SupabaseProductRow,
      );
      await triggerBackInStockAlerts({
        ...normalized,
        stock: newStock,
      });
    } catch (notificationError) {
      const { errorMessage, errorStack } = normalizeError(notificationError);
      logWarn('Failed to trigger back-in-stock alerts', {
        action: 'triggerBackInStockAlerts',
        adminId: admin.id,
        productId,
        errorMessage,
        errorStack,
      });
    }
  }

  await createAuditLog(admin.id, AUDIT_ACTIONS.STOCK_UPDATED, ENTITY_TYPES.PRODUCT, productId, {
    before: { stock: prevStock },
    after: { stock: newStock },
  });

  revalidateProductPaths();

  return { success: true };
}

export async function fetchAdminProducts(): Promise<Product[]> {
  await requireAdmin();
  try {
    const rows = await db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt));

    return rows.map((row) =>
      normalizeSupabaseProduct(row as unknown as SupabaseProductRow),
    );
  } catch (error) {
    const { errorMessage, errorStack } = normalizeError(error);
    logError('Failed to load admin products', {
      action: 'getAdminProducts',
      errorMessage,
      errorStack,
    });
    return [];
  }
}
