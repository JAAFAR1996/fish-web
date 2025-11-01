import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { LoyaltyPointsTransaction, LoyaltyPointsSummary } from '@/types';
import { calculatePointsEarned, calculatePointsDiscount, validatePointsRedemption } from './loyalty-helpers';

/**
 * Get user's current loyalty points balance
 */
export async function getUserPointsBalance(userId: string): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('loyalty_points_balance')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    console.error(`[Loyalty] Error fetching balance for user ${userId}:`, error);
    return 0;
  }

  return data.loyalty_points_balance || 0;
}

// Re-export helper functions for backward compatibility
export { calculatePointsEarned, calculatePointsDiscount, validatePointsRedemption };

/**
 * Award points to user (called when order confirmed)
 */
export async function awardPoints(
  userId: string,
  points: number,
  orderId: string,
  description: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Insert transaction record
  const { error: transactionError } = await supabase
    .from('loyalty_points')
    .insert({
      user_id: userId,
      transaction_type: 'earned',
      points,
      order_id: orderId,
      description,
    });

  if (transactionError) {
    console.error(`[Loyalty] Error creating transaction for user ${userId}:`, transactionError);
    return;
  }

  // RPC parameters must match SQL signature (p_user_id, p_amount)
  const { error: balanceError } = await supabase.rpc('increment_loyalty_balance', {
    p_user_id: userId,
    p_amount: points,
  });

  if (balanceError) {
    console.error(`[Loyalty] Error updating balance for user ${userId}:`, balanceError);
  }
}

/**
 * Redeem points from user (called when order created with points redemption)
 */
export async function redeemPoints(
  userId: string,
  points: number,
  orderId: string,
  description: string
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Insert transaction record (negative points)
  const { error: transactionError } = await supabase
    .from('loyalty_points')
    .insert({
      user_id: userId,
      transaction_type: 'redeemed',
      points: -points,
      order_id: orderId,
      description,
    });

  if (transactionError) {
    console.error(`[Loyalty] Error creating redemption transaction for user ${userId}:`, transactionError);
    return;
  }

  // RPC parameters must match SQL signature (p_user_id, p_amount)
  const { error: balanceError } = await supabase.rpc('increment_loyalty_balance', {
    p_user_id: userId,
    p_amount: -points,
  });

  if (balanceError) {
    console.error(`[Loyalty] Error updating balance for user ${userId}:`, balanceError);
  }
}

/**
 * Get user's loyalty points transaction history
 */
export async function getPointsHistory(userId: string, limit: number = 10): Promise<LoyaltyPointsTransaction[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('loyalty_points')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error(`[Loyalty] Error fetching history for user ${userId}:`, error);
    return [];
  }

  return data as LoyaltyPointsTransaction[];
}

/**
 * Get loyalty points summary for user
 */
export async function getLoyaltyPointsSummary(userId: string): Promise<LoyaltyPointsSummary> {
  const balance = await getUserPointsBalance(userId);
  const transactions = await getPointsHistory(userId, 20);

  const totalEarned = transactions
    .filter(t => t.transaction_type === 'earned')
    .reduce((sum, t) => sum + t.points, 0);

  const totalRedeemed = Math.abs(
    transactions
      .filter(t => t.transaction_type === 'redeemed')
      .reduce((sum, t) => sum + t.points, 0)
  );

  return {
    balance,
    totalEarned,
    totalRedeemed,
    recentTransactions: transactions.slice(0, 10),
  };
}
