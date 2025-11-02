import type {
  OrderUpdateData,
  ProductFormData,
  ValidationResult,
} from '@/types';

import { MAX_PRODUCT_IMAGES } from './constants';

const createResult = (errors: Record<string, string>): ValidationResult => ({
  valid: Object.keys(errors).length === 0,
  errors,
});

export function validateProductForm(data: ProductFormData): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.name?.trim()) {
    errors.name = 'admin.validation.nameRequired';
  }

  if (!data.brand?.trim()) {
    errors.brand = 'admin.validation.brandRequired';
  }

  if (!data.category?.trim()) {
    errors.category = 'admin.validation.categoryRequired';
  }

  if (!data.subcategory?.trim()) {
    errors.subcategory = 'admin.validation.subcategoryRequired';
  }

  if (!data.description?.trim()) {
    errors.description = 'admin.validation.descriptionRequired';
  }

  if (!Number.isFinite(data.price) || data.price <= 0) {
    errors.price = 'admin.validation.priceInvalid';
  }

  if (
    data.originalPrice !== null &&
    Number.isFinite(data.originalPrice) &&
    data.originalPrice <= data.price
  ) {
    errors.originalPrice = 'admin.validation.originalPriceInvalid';
  }

  if (!Number.isFinite(data.stock) || data.stock < 0) {
    errors.stock = 'admin.validation.stockInvalid';
  }

  if (!Number.isFinite(data.lowStockThreshold) || data.lowStockThreshold < 0) {
    errors.lowStockThreshold = 'admin.validation.lowStockThresholdInvalid';
  }

  if (Array.isArray(data.images)) {
    if (data.images.length > MAX_PRODUCT_IMAGES) {
      errors.images = 'admin.validation.imageCountExceeded';
    }

    const invalidImage = data.images.find(
      (image) => typeof image !== 'string' || image.trim() === '',
    );

    if (invalidImage) {
      errors.images = 'admin.validation.imageUrlInvalid';
    }
  }

  const specs = data.specifications;
  if (!specs) {
    errors.specifications = 'admin.validation.specificationsRequired';
  } else {
    const hasFlow = specs.flow !== null && Number.isFinite(specs.flow);
    const hasPower = specs.power !== null && Number.isFinite(specs.power);

    if (!hasFlow && !hasPower) {
      errors['specifications.flow'] = 'admin.validation.flowOrPowerRequired';
    }

    if (!specs.compatibility) {
      errors['specifications.compatibility'] =
        'admin.validation.compatibilityRequired';
    }
  }

  return createResult(errors);
}

export function validateOrderUpdate(data: OrderUpdateData): ValidationResult {
  const errors: Record<string, string> = {};
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

  if (!validStatuses.includes(data.status)) {
    errors.status = 'admin.validation.statusInvalid';
  }

  if (data.status === 'shipped') {
    if (!data.tracking_number?.trim()) {
      errors.tracking_number = 'admin.validation.trackingRequired';
    }
    if (!data.carrier?.trim()) {
      errors.carrier = 'admin.validation.carrierRequired';
    }
  }

  return createResult(errors);
}

export function validateStockUpdate(newStock: number): ValidationResult {
  const errors: Record<string, string> = {};

  if (!Number.isFinite(newStock) || newStock < 0) {
    errors.stock = 'admin.validation.stockInvalid';
  }

  if (!Number.isInteger(newStock) && errors.stock === undefined) {
    errors.stock = 'admin.validation.stockInteger';
  }

  return createResult(errors);
}
