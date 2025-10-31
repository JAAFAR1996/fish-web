'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/utils';
import { generateReferralCode } from './referral-utils';

type EnsureReferralCodeResponse = {
  success: boolean;
  code?: string;
  error?: string;
};

const UNIQUE_VIOLATION = '23505';

export async function ensureReferralCodeAction(): Promise<EnsureReferralCodeResponse> {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('referral_code')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('[Referrals] Failed to fetch profile for referral code generation', error);
    return { success: false, error: 'generateFailed' };
  }

  if (profile?.referral_code) {
    return { success: true, code: profile.referral_code };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateReferralCode();

    const { data: updated, error: updateError } = await supabase
      .from('profiles')
      .update({ referral_code: code })
      .eq('id', user.id)
      .is('referral_code', null)
      .select('referral_code')
      .single();

    if (!updateError && updated?.referral_code) {
      return { success: true, code: updated.referral_code };
    }

    if (updateError?.code === UNIQUE_VIOLATION) {
      continue;
    }

    if (updateError?.code === 'PGRST116') {
      // No rows updated, possibly due to referral code being set concurrently.
      const { data: refreshed } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (refreshed?.referral_code) {
        return { success: true, code: refreshed.referral_code };
      }
      continue;
    }

    if (updateError) {
      console.error('[Referrals] Failed to update referral code', updateError);
      return { success: false, error: 'generateFailed' };
    }
  }

  console.error('[Referrals] Exhausted attempts to generate unique referral code');
  return { success: false, error: 'generateFailed' };
}
