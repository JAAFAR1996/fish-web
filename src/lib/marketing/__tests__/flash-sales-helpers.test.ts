import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getEffectiveUnitPrice } from '../flash-sales-helpers';
import type { FlashSale, Product } from '../../../types';

const baseProduct: Product = {
  id: 'prod-1',
  slug: 'prod-1',
  name: 'Test Product',
  brand: 'Test Brand',
  category: 'Filters',
  subcategory: 'Internal',
  description: 'Test product description',
  price: 100,
  originalPrice: 120,
  currency: 'IQD',
  images: [],
  thumbnail: '',
  rating: 0,
  reviewCount: 0,
  stock: 10,
  lowStockThreshold: 2,
  inStock: true,
  isNew: false,
  isBestSeller: false,
  specifications: {
    flow: null,
    power: null,
    compatibility: {
      minTankSize: null,
      maxTankSize: null,
      displayText: '',
    },
    dimensions: null,
    weight: null,
  },
};

const baseFlashSale: FlashSale = {
  id: 'flash-1',
  product_id: baseProduct.id,
  flash_price: 80,
  original_price: baseProduct.price,
  stock_limit: 100,
  stock_sold: 0,
  starts_at: new Date(Date.now() - 60_000).toISOString(),
  ends_at: new Date(Date.now() + 60_000).toISOString(),
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

test('returns flash sale price when the sale is active', () => {
  const product: Product = {
    ...baseProduct,
    flashSale: {
      ...baseFlashSale,
      is_active: true,
      starts_at: new Date(Date.now() - 5 * 60_000).toISOString(),
      ends_at: new Date(Date.now() + 5 * 60_000).toISOString(),
      flash_price: 75,
    },
  };

  assert.equal(getEffectiveUnitPrice(product), 75);
});

test('returns regular price when flash sale is inactive', () => {
  const product: Product = {
    ...baseProduct,
    flashSale: {
      ...baseFlashSale,
      is_active: false,
    },
  };

  assert.equal(getEffectiveUnitPrice(product), baseProduct.price);
});

test('returns regular price when flash sale has expired', () => {
  const product: Product = {
    ...baseProduct,
    flashSale: {
      ...baseFlashSale,
      starts_at: new Date(Date.now() - 10 * 60_000).toISOString(),
      ends_at: new Date(Date.now() - 5 * 60_000).toISOString(),
    },
  };

  assert.equal(getEffectiveUnitPrice(product), baseProduct.price);
});

test('returns regular price when no flash sale is attached', () => {
  const product: Product = { ...baseProduct, flashSale: undefined };

  assert.equal(getEffectiveUnitPrice(product), baseProduct.price);
});
