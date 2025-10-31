import type { MutableRefObject, Ref } from 'react';

import type {
  Direction,
  Locale,
  Product,
  ProductBadge,
  ProductFilters,
  SocialProofData,
} from '@/types';

export function cn(
  ...inputs: Array<string | false | null | undefined>
): string {
  return inputs.filter((value): value is string => Boolean(value)).join(' ');
}

export function formatCurrency(amount: number, locale: Locale): string {
  const formatter = new Intl.NumberFormat(
    locale === 'ar' ? 'ar-IQ' : 'en-IQ',
    {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }
  );

  return formatter.format(amount);
}

export function getDirection(locale: string): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function mergeRefs<T>(
  ...refs: Array<Ref<T> | undefined>
): (instance: T | null) => void {
  return (instance: T | null) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === 'function') {
        ref(instance);
      } else {
        (ref as MutableRefObject<T | null>).current = instance;
      }
    }
  };
}

export function getDiscountPercentage(
  originalPrice: number | null,
  currentPrice: number | null
): number {
  if (
    originalPrice == null ||
    currentPrice == null ||
    originalPrice <= 0 ||
    currentPrice >= originalPrice
  ) {
    return 0;
  }

  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

export function formatProductSpec(
  value: number | null,
  unit: string,
  locale: Locale
): string {
  if (value == null || Number.isNaN(value)) {
    return '';
  }

  const numberFormatter = new Intl.NumberFormat(
    locale === 'ar' ? 'ar-IQ' : 'en-US',
    {
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }
  );

  const formattedValue = numberFormatter.format(value);
  return `${formattedValue} ${unit}`.trim();
}

export function formatCompatibility(
  minSize: number | null,
  maxSize: number | null,
  locale: Locale,
  templates: {
    upTo: (value: string) => string;
    range: (min: string, max: string) => string;
    from: (value: string) => string;
  }
): string {
  if (minSize == null && maxSize == null) {
    return '';
  }

  const numberFormatter = new Intl.NumberFormat(
    locale === 'ar' ? 'ar-IQ' : 'en-US',
    {
      maximumFractionDigits: 0,
    }
  );

  const formatValue = (value: number) => numberFormatter.format(value);

  if (minSize != null && maxSize != null) {
    return templates.range(formatValue(minSize), formatValue(maxSize));
  }

  if (maxSize != null) {
    return templates.upTo(formatValue(maxSize));
  }

  if (minSize != null) {
    return templates.from(formatValue(minSize));
  }

  return '';
}

export function getProductBadges(product: Product): ProductBadge[] {
  const badges: ProductBadge[] = [];

  if (isOutOfStock(product)) {
    badges.push('outOfStock');
  }

  const discount = getDiscountPercentage(
    product.originalPrice,
    product.price
  );
  if (discount > 0) {
    badges.push('discount');
  }

  if (product.isBestSeller) {
    badges.push('bestSeller');
  }

  if (product.isNew) {
    badges.push('new');
  }

  return badges.slice(0, 2);
}

export function isLowStock(product: Product): boolean {
  return product.stock > 0 && product.stock <= product.lowStockThreshold;
}

export function isOutOfStock(product: Product): boolean {
  return product.stock <= 0;
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return (
    filters.types.length > 0 ||
    filters.tankSizeMin !== null ||
    filters.tankSizeMax !== null ||
    filters.flowRateMin !== null ||
    filters.flowRateMax !== null ||
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.subcategories.length > 0
  );
}

export function getActiveFilterCount(filters: ProductFilters): number {
  let count = 0;
  if (filters.types.length > 0) count += filters.types.length;
  if (filters.tankSizeMin !== null || filters.tankSizeMax !== null) count += 1;
  if (filters.flowRateMin !== null || filters.flowRateMax !== null) count += 1;
  if (filters.brands.length > 0) count += filters.brands.length;
  if (filters.categories.length > 0) count += filters.categories.length;
  if (filters.subcategories.length > 0) count += filters.subcategories.length;
  return count;
}

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

export function generateSocialProofData(product: Product): SocialProofData {
  const baseHash = Math.abs(hashString(product.id)) || 1;
  const ratingFactor = 0.6 + (product.rating / 5) * 0.4;
  const bestSellerBoost = product.isBestSeller ? 1.15 : 1;

  const viewedTodayBase = 20 + (baseHash % 131);
  const viewedToday = Math.max(
    12,
    Math.round(viewedTodayBase * ratingFactor * bestSellerBoost)
  );

  const reviewDerived = Math.max(0, Math.round(product.reviewCount / 10));
  const boughtThisWeek = Math.max(
    1,
    Math.round(
      (reviewDerived + (baseHash % 8)) * (0.8 + ratingFactor * 0.6) * bestSellerBoost
    )
  );

  const inCartBase = 5 + (baseHash % 26);
  const inCart = Math.max(
    1,
    Math.round(inCartBase * (0.7 + ratingFactor * 0.5))
  );

  return {
    viewedToday,
    boughtThisWeek,
    inCart,
    timestamp: Date.now(),
  };
}

export function formatWhatsAppMessage(product: Product, locale: Locale): string {
  const message =
    locale === 'ar'
      ? `مرحباً، أنا مهتم بـ ${product.name} (${product.brand}). هل هو متوفر؟`
      : `Hi, I'm interested in ${product.name} (${product.brand}). Is it available?`;

  return encodeURIComponent(message);
}

export function getWhatsAppUrl(
  product: Product,
  locale: Locale,
  phoneNumber: string = '9647000000000'
): string {
  const sanitizedNumber = phoneNumber.replace(/[^\d]/g, '');
  const message = formatWhatsAppMessage(product, locale);
  return `https://wa.me/${sanitizedNumber}?text=${message}`;
}
export function getWhatsAppShareUrl(
  product: Product,
  locale: Locale,
  phoneNumber: string | undefined,
  pageUrl: string
): string {
  const sanitizedNumber = (phoneNumber ?? '9647000000000').replace(/[^\d]/g, '');
  const baseMessage =
    locale === 'ar'
      ? `شاهد ${product.name} (${product.brand})`
      : `Check out ${product.name} (${product.brand})`;
  const message = encodeURIComponent(`${baseMessage}\n${pageUrl}`);
  return `https://wa.me/${sanitizedNumber}?text=${message}`;
}
