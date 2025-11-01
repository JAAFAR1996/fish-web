import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { Referral, ReferralStats } from '@/types';
import { REFERRAL_REWARD_POINTS, REFEREE_REWARD_POINTS } from './constants';
import { awardPoints } from './loyalty-utils';

/**
 * Get referrer info by referral code (server-only)
 */
export async function getReferralByCode(
  code: string
): Promise<{ userId: string; fullName: string | null } | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('referral_code', code)
    .maybeSingle();

  if (error || !data) {
    console.error(`[Referrals] Error fetching referral by code ${code}:`, error);
    return null;
  }

  return {
    userId: data.id,
    fullName: data.full_name,
  };
}

/**
 * Create referral record when referee signs up (server-only)
 */
export async function createReferral(
  referrerId: string,
  refereeId: string,
  referralCode: string
): Promise<Referral | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrerId,
      referee_id: refereeId,
      referral_code: referralCode,
      status: 'pending',
      reward_type: 'points',
      reward_value: REFERRAL_REWARD_POINTS,
    })
    .select()
    .single();

  if (error) {
    console.error(`[Referrals] Error creating referral for ${refereeId}:`, error);
    return null;
  }

  return data as Referral;
}

/**
 * Process referral reward when referee makes first purchase (server-only)
 */
export async function processReferralReward(refereeId: string, firstOrderId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Get pending referral for this referee
  const { data: referral, error: fetchError } = await supabase
    .from('referrals')
    .select('*')
    .eq('referee_id', refereeId)
    .eq('status', 'pending')
    .maybeSingle();

  if (fetchError || !referral) {
    console.log(`[Referrals] No pending referral found for user ${refereeId}`);
    return;
  }

  // Update referral status to completed
  const { error: updateError } = await supabase
    .from('referrals')
    .update({
      status: 'completed',
      referee_first_order_id: firstOrderId,
    })
    .eq('id', referral.id);

  if (updateError) {
    console.error(`[Referrals] Error updating referral ${referral.id}:`, updateError);
    return;
  }

  // Award points to referrer
  await awardPoints(
    referral.referrer_id,
    REFERRAL_REWARD_POINTS,
    firstOrderId,
    'Referral reward - friend made first purchase'
  );

  // Award points to referee
  await awardPoints(
    refereeId,
    REFEREE_REWARD_POINTS,
    firstOrderId,
    'Signup bonus - referral reward'
  );

  // Update referral status to rewarded
  await supabase
    .from('referrals')
    .update({
      status: 'rewarded',
      rewarded_at: new Date().toISOString(),
    })
    .eq('id', referral.id);

  console.log(`[Referrals] Processed referral reward for ${refereeId} and ${referral.referrer_id}`);
}

/**
 * Get referral stats for a user (server-only)
 */
export async function getUserReferralStats(userId: string): Promise<ReferralStats> {
  const supabase = await createServerSupabaseClient();

  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId);

  if (error) {
    console.error(`[Referrals] Error fetching referral stats for ${userId}:`, error);
    return {
      totalReferrals: 0,
      completedReferrals: 0,
      pendingRewards: 0,
      totalRewardsEarned: 0,
    };
  }

  const totalReferrals = referrals.length;
  const completedReferrals = referrals.filter(r => r.status === 'completed' || r.status === 'rewarded').length;
  const pendingRewards = referrals.filter(r => r.status === 'completed' && !r.rewarded_at).length;
  const totalRewardsEarned = referrals
    .filter(r => r.status === 'rewarded')
    .reduce((sum, r) => sum + r.reward_value, 0);

  return {
    totalReferrals,
    completedReferrals,
    pendingRewards,
    totalRewardsEarned,
  };
}
