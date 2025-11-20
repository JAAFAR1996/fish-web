'use server';

import {
  getComplementaryProducts,
  getProductsBySameSubcategory,
  getProductsWithFlashSales,
  getRelatedProducts,
} from './products';

import type { Product, ProductWithFlashSale } from '@/types';

export async function getProductsWithFlashSalesAction(): Promise<ProductWithFlashSale[]> {
  try {
    return await getProductsWithFlashSales();
  } catch (error) {
    console.error('[Products Action] Failed to load products with flash sales:', error);
    return [];
  }
}

export async function getComplementaryProductsAction(
  product: Product,
  limit: number = 4,
): Promise<Product[]> {
  try {
    return await getComplementaryProducts(product, limit);
  } catch (error) {
    console.error('[Products Action] Failed to load complementary products:', error);
    return [];
  }
}

export async function getRelatedProductsAction(
  product: Product,
  limit: number = 8,
): Promise<Product[]> {
  try {
    return await getRelatedProducts(product, limit);
  } catch (error) {
    console.error('[Products Action] Failed to load related products:', error);
    return [];
  }
}

export async function getProductsBySameSubcategoryAction(
  product: Product,
  limit: number = 4,
): Promise<Product[]> {
  try {
    return await getProductsBySameSubcategory(product, limit);
  } catch (error) {
    console.error('[Products Action] Failed to load products by subcategory:', error);
    return [];
  }
}
