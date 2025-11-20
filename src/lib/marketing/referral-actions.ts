'use server';

import { db } from '@server/db';
import { profiles } from '@shared/schema';
import { and, eq, isNull } from 'drizzle-orm';

import { requireUser } from '@/lib/auth/utils';
import { generateReferralCode } from './referral-utils-client';

type EnsureReferralCodeResponse = {
  success: boolean;
  code?: string;
  error?: string;
};

const UNIQUE_VIOLATION = '23505';

export async function ensureReferralCodeAction(): Promise<EnsureReferralCodeResponse> {
  const user = await requireUser();

  try {
    const [profile] = await db
      .select({ referralCode: profiles.referralCode })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (profile?.referralCode) {
      return { success: true, code: profile.referralCode };
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = generateReferralCode();

      try {
        const updated = await db
          .update(profiles)
          .set({ referralCode: code })
          .where(and(eq(profiles.id, user.id), isNull(profiles.referralCode)))
          .returning({ referralCode: profiles.referralCode });

        if (updated.length && updated[0].referralCode) {
          return { success: true, code: updated[0].referralCode };
        }
      } catch (error) {
        const pgError = error as { code?: string };
        if (pgError?.code === UNIQUE_VIOLATION) {
          continue;
        }

        console.error('[Referrals] Failed to update referral code', error);
        return { success: false, error: 'generateFailed' };
      }

      const [refreshed] = await db
        .select({ referralCode: profiles.referralCode })
        .from(profiles)
        .where(eq(profiles.id, user.id))
        .limit(1);

      if (refreshed?.referralCode) {
        return { success: true, code: refreshed.referralCode };
      }
    }
  } catch (error) {
    console.error('[Referrals] Failed to fetch profile for referral code generation', error);
    return { success: false, error: 'generateFailed' };
  }

  console.error('[Referrals] Exhausted attempts to generate unique referral code');
  return { success: false, error: 'generateFailed' };
}
