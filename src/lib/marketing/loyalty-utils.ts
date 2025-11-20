import { db } from '@server/db';
import { loyaltyPoints, profiles } from '@shared/schema';
import { and, desc, eq, sql } from 'drizzle-orm';

import type { LoyaltyPointsTransaction, LoyaltyPointsSummary } from '@/types';
import { calculatePointsEarned, calculatePointsDiscount, validatePointsRedemption } from './loyalty-helpers';

const toIsoString = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : value ?? new Date(0).toISOString();

type LoyaltyPointsRow = typeof loyaltyPoints.$inferSelect;

function transformLoyaltyTransaction(row: LoyaltyPointsRow): LoyaltyPointsTransaction {
  return {
    id: row.id,
    user_id: row.userId,
    transaction_type: row.transactionType as LoyaltyPointsTransaction['transaction_type'],
    points: row.points,
    order_id: row.orderId ?? null,
    description: row.description ?? null,
    created_at: toIsoString(row.createdAt),
  };
}

/**
 * Get user's current loyalty points balance
 */
export async function getUserPointsBalance(userId: string): Promise<number> {
  try {
    const [row] = await db
      .select({ balance: profiles.loyaltyPointsBalance })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    return row?.balance ?? 0;
  } catch (error) {
    console.error(`[Loyalty] Error fetching balance for user ${userId}:`, error);
    return 0;
  }
}

// Re-export helper functions for backward compatibility
export { calculatePointsEarned, calculatePointsDiscount, validatePointsRedemption };

/**
 * Award points to user within a transaction
 */
export async function awardPointsInTransaction(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  userId: string,
  points: number,
  orderId: string,
  description: string
): Promise<void> {
  await tx.insert(loyaltyPoints).values({
    userId,
    transactionType: 'earned',
    points,
    orderId,
    description,
  });

  await tx
    .update(profiles)
    .set({
      loyaltyPointsBalance: sql`${profiles.loyaltyPointsBalance} + ${points}`,
    })
    .where(eq(profiles.id, userId));
}

/**
 * Award points to user (called when order confirmed)
 */
export async function awardPoints(
  userId: string,
  points: number,
  orderId: string,
  description: string
): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      await awardPointsInTransaction(tx, userId, points, orderId, description);
    });
  } catch (error) {
    console.error(`[Loyalty] Error awarding points for user ${userId}:`, error);
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
): Promise<{ success: boolean; error?: string }> {
  try {
    let updateResult: Array<{ id: string }> = [];

    await db.transaction(async (tx) => {
      updateResult = await tx
        .update(profiles)
        .set({
          loyaltyPointsBalance: sql`${profiles.loyaltyPointsBalance} - ${points}`,
        })
        .where(
          and(
            eq(profiles.id, userId),
            sql`${profiles.loyaltyPointsBalance} >= ${points}`
          )
        )
        .returning({ id: profiles.id });

      if (updateResult.length === 0) {
        throw new Error('Insufficient loyalty points balance');
      }

      await tx.insert(loyaltyPoints).values({
        userId,
        transactionType: 'redeemed',
        points: -points,
        orderId,
        description,
      });
    });

    if (updateResult.length === 0) {
      return { success: false, error: 'Insufficient loyalty points balance' };
    }

    return { success: true };
  } catch (error) {
    console.error(`[Loyalty] Error redeeming points for user ${userId}:`, error);
    if (error instanceof Error && error.message === 'Insufficient loyalty points balance') {
      return { success: false, error: 'Insufficient loyalty points balance' };
    }
    return { success: false, error: 'Failed to redeem points' };
  }
}

/**
 * Get user's loyalty points transaction history
 */
export async function getPointsHistory(userId: string, limit: number = 10): Promise<LoyaltyPointsTransaction[]> {
  try {
    const rows = await db
      .select()
      .from(loyaltyPoints)
      .where(eq(loyaltyPoints.userId, userId))
      .orderBy(desc(loyaltyPoints.createdAt))
      .limit(limit);

    return rows.map(transformLoyaltyTransaction);
  } catch (error) {
    console.error(`[Loyalty] Error fetching history for user ${userId}:`, error);
    return [];
  }
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
