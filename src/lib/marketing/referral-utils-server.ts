import { db } from '@server/db';
import { profiles, referrals } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

import type { Referral, ReferralStats } from '@/types';
import { REFERRAL_REWARD_POINTS, REFEREE_REWARD_POINTS } from './constants';
import { awardPoints, awardPointsInTransaction } from './loyalty-utils';

const toIsoString = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : value ?? new Date(0).toISOString();

type ReferralRow = typeof referrals.$inferSelect;

function transformReferral(row: ReferralRow): Referral {
  return {
    id: row.id,
    referrer_id: row.referrerId,
    referee_id: row.refereeId,
    referral_code: row.referralCode,
    status: row.status as Referral['status'],
    reward_type: row.rewardType as Referral['reward_type'],
    reward_value: Number.parseFloat(String(row.rewardValue ?? 0)),
    referee_first_order_id: row.refereeFirstOrderId ?? null,
    rewarded_at: row.rewardedAt ? toIsoString(row.rewardedAt) : null,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  };
}

/**
 * Get referrer info by referral code (server-only)
 */
export async function getReferralByCode(
  code: string
): Promise<{ userId: string; fullName: string | null } | null> {
  try {
    const [row] = await db
      .select({ id: profiles.id, fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.referralCode, code))
      .limit(1);

    if (!row) {
      return null;
    }

    return {
      userId: row.id,
      fullName: row.fullName,
    };
  } catch (error) {
    console.error(`[Referrals] Error fetching referral by code ${code}:`, error);
    return null;
  }
}

/**
 * Create referral record when referee signs up (server-only)
 */
export async function createReferral(
  referrerId: string,
  refereeId: string,
  referralCode: string
): Promise<Referral | null> {
  try {
    const [row] = await db
      .insert(referrals)
      .values({
        referrerId,
        refereeId,
        referralCode,
        status: 'pending',
        rewardType: 'points',
        rewardValue: String(REFERRAL_REWARD_POINTS),
      })
      .returning();

    return row ? transformReferral(row) : null;
  } catch (error) {
    console.error(`[Referrals] Error creating referral for ${refereeId}:`, error);
    return null;
  }
}

/**
 * Process referral reward when referee makes first purchase (server-only)
 */
export async function processReferralReward(refereeId: string, firstOrderId: string): Promise<void> {
  try {
    await db.transaction(async (tx) => {
      const [referralRow] = await tx
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.refereeId, refereeId),
            eq(referrals.status, 'pending'),
          ),
        )
        .limit(1);

      if (!referralRow) {
        console.log(`[Referrals] No pending referral found for user ${refereeId}`);
        return;
      }

      await tx
        .update(referrals)
        .set({
          status: 'completed',
          refereeFirstOrderId: firstOrderId,
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, referralRow.id));

      await awardPointsInTransaction(
        tx,
        referralRow.referrerId,
        REFERRAL_REWARD_POINTS,
        firstOrderId,
        'Referral reward - friend made first purchase',
      );

      await awardPointsInTransaction(
        tx,
        refereeId,
        REFEREE_REWARD_POINTS,
        firstOrderId,
        'Signup bonus - referral reward',
      );

      await tx
        .update(referrals)
        .set({
          status: 'rewarded',
          rewardedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, referralRow.id));

      console.log(
        `[Referrals] Processed referral reward for ${refereeId} and ${referralRow.referrerId}`,
      );
    });
  } catch (error) {
    console.error(`[Referrals] Error processing referral reward for ${refereeId}:`, error);
  }
}

/**
 * Get referral stats for a user (server-only)
 */
export async function getUserReferralStats(userId: string): Promise<ReferralStats> {
  try {
    const rows = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerId, userId));

    const totals = rows.reduce(
      (acc, row) => {
        const rewardValue = Number.parseFloat(String(row.rewardValue ?? 0));
        if (row.status === 'completed' || row.status === 'rewarded') {
          acc.completed += 1;
        }
        if (row.status === 'completed' && !row.rewardedAt) {
          acc.pending += 1;
        }
        if (row.status === 'rewarded') {
          acc.rewards += rewardValue;
        }

        return acc;
      },
      { completed: 0, pending: 0, rewards: 0 },
    );

    return {
      totalReferrals: rows.length,
      completedReferrals: totals.completed,
      pendingRewards: totals.pending,
      totalRewardsEarned: totals.rewards,
    };
  } catch (error) {
    console.error(`[Referrals] Error fetching referral stats for ${userId}:`, error);
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingRewards: 0,
      totalRewardsEarned: 0,
    };
  }
}
