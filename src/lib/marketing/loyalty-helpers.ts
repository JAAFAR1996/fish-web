// Loyalty Points Helper Functions (Client-Safe)
// Pure calculation utilities with no server dependencies
// Safe to import in Client Components

import {
  POINTS_PER_IQD,
  POINTS_REDEMPTION_RATE,
  MIN_POINTS_REDEMPTION,
  MAX_POINTS_REDEMPTION_PERCENTAGE,
} from './constants';

/**
 * Calculate points earned from order total
 * Formula: 1 point per 1000 IQD spent
 */
export function calculatePointsEarned(orderTotal: number): number {
  return Math.floor(orderTotal / 1000) * POINTS_PER_IQD;
}

/**
 * Calculate discount amount from points
 * Formula: 100 points = 5000 IQD (1 point = 50 IQD)
 */
export function calculatePointsDiscount(points: number): number {
  const normalizedPoints = Math.floor(points);
  const rawDiscount = normalizedPoints * POINTS_REDEMPTION_RATE;
  return Math.floor(rawDiscount);
}

/**
 * Validate points redemption request
 */
export function validatePointsRedemption(
  points: number,
  balance: number,
  orderSubtotal: number
): { valid: boolean; error?: string } {
  if (!Number.isFinite(points)) {
    return { valid: false, error: 'loyalty.invalidPoints' };
  }

  const normalizedPoints = Math.floor(points);

  if (normalizedPoints <= 0) {
    return { valid: false, error: 'loyalty.invalidPoints' };
  }

  if (normalizedPoints > balance) {
    return { valid: false, error: 'loyalty.notEnoughPoints' };
  }

  if (normalizedPoints < MIN_POINTS_REDEMPTION) {
    return { valid: false, error: 'loyalty.minRedemption' };
  }

  const discount = calculatePointsDiscount(normalizedPoints);
  const maxDiscount = Math.floor(
    (orderSubtotal * MAX_POINTS_REDEMPTION_PERCENTAGE) / 100
  );

  if (discount > maxDiscount) {
    return { valid: false, error: 'loyalty.maxRedemptionExceeded' };
  }

  return { valid: true };
}
