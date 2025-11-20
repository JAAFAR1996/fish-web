import { sql, eq, and, or, isNull, lt } from 'drizzle-orm';

import type { Coupon, Locale } from '@/types';
import { db } from '@server/db';
import { coupons } from '@shared/schema';

import { formatCurrency } from '@/lib/utils';

import { MAX_COUPON_PERCENTAGE } from './constants';

const toNumber = (value: unknown): number =>
  typeof value === 'number' ? value : Number(value ?? 0);

const toNullableIso = (value: unknown): string | null => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  return null;
};

const toIsoString = (value: unknown): string =>
  toNullableIso(value) ?? new Date().toISOString();

function transformCoupon(row: typeof coupons.$inferSelect): Coupon {
  return {
    id: row.id,
    code: row.code,
    discount_type: row.discountType === 'percentage' ? 'percentage' : 'fixed',
    discount_value: toNumber(row.discountValue ?? 0),
    min_order_value: row.minOrderValue !== null ? toNumber(row.minOrderValue) : null,
    max_discount: row.maxDiscount !== null ? toNumber(row.maxDiscount) : null,
    usage_limit: row.usageLimit,
    used_count: row.usedCount,
    is_active: row.isActive,
    expiry_date: toNullableIso(row.expiryDate),
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  };
}

export async function validateCoupon(
  code: string,
  subtotal: number
): Promise<
  | { valid: true; coupon: Coupon }
  | { valid: false; error: string; params?: Record<string, string | number> }
> {
  if (!code) {
    return { valid: false, error: 'checkout.coupon.invalidCode' };
  }

  const normalizedCode = code.trim().toUpperCase();

  try {
    const [row] = await db
      .select()
      .from(coupons)
      .where(
        and(eq(coupons.code, normalizedCode), eq(coupons.isActive, true))
      )
      .limit(1);

    if (!row) {
      return { valid: false, error: 'checkout.coupon.invalidCode' };
    }

    const coupon = transformCoupon(row);

    if (coupon.expiry_date) {
      const expiresAt = new Date(coupon.expiry_date).getTime();
      if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
        return { valid: false, error: 'checkout.coupon.expired' };
      }
    }

    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return { valid: false, error: 'checkout.coupon.usageLimitReached' };
    }

    if (coupon.min_order_value !== null && subtotal < coupon.min_order_value) {
      return {
        valid: false,
        error: 'checkout.coupon.minOrderNotMet',
        params: { amount: coupon.min_order_value },
      };
    }

    return { valid: true, coupon };
  } catch (error) {
    console.error('Failed to validate coupon', error);
    return { valid: false, error: 'checkout.coupon.invalidCode' };
  }
}

export function calculateDiscount(coupon: Coupon, subtotal: number): number {
  const safeSubtotal = Math.max(0, subtotal);

  if (coupon.discount_type === 'percentage') {
    const percentage = Math.min(coupon.discount_value, MAX_COUPON_PERCENTAGE);
    const rawDiscount = Math.round((safeSubtotal * percentage) / 100);
    if (coupon.max_discount !== null) {
      return Math.min(rawDiscount, coupon.max_discount);
    }
    return rawDiscount;
  }

  if (coupon.discount_type === 'fixed') {
    return Math.min(Math.round(coupon.discount_value), safeSubtotal);
  }

  return 0;
}

export async function incrementCouponUsage(couponId: string): Promise<boolean> {
  try {
    const result = await db
      .update(coupons)
      .set({ 
        usedCount: sql`used_count + 1` 
      })
      .where(and(
        eq(coupons.id, couponId),
        eq(coupons.isActive, true),
        or(
          isNull(coupons.usageLimit),
          lt(coupons.usedCount, coupons.usageLimit)
        )
      ))
      .returning({ id: coupons.id });

    const updated = result.length > 0;
    if (!updated) {
      console.warn('Coupon usage increment skipped due to limit or inactive coupon', {
        couponId,
      });
    }
    return updated;
  } catch (error) {
    console.error('Failed to increment coupon usage', error);
    return false;
  }

  return true;
}

export function formatCouponDiscount(
  coupon: Coupon,
  locale: Locale
): string {
  if (coupon.discount_type === 'percentage') {
    return `${coupon.discount_value}% off`;
  }

  return `${formatCurrency(coupon.discount_value, locale)} off`;
}
