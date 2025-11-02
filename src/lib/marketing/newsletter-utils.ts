import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { NewsletterSubscriber } from '@/types';

/**
 * Subscribe email to newsletter
 */
export async function subscribeToNewsletter(
  email: string,
  userId: string | null = null
): Promise<{ success: boolean; alreadySubscribed?: boolean; unsubscribeToken?: string; error?: string }> {
  const supabase = await createServerSupabaseClient();
  
  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();

  // Check subscription status via RPC for guests
  const { data: statusData, error: statusError } = await supabase.rpc('newsletter_is_subscribed', {
    p_email: normalizedEmail,
  });

  if (statusError) {
    console.error('[Newsletter] Error checking subscription status:', statusError);
    return { success: false, error: 'marketing.newsletter.subscriptionFailed' };
  }

  const status = Array.isArray(statusData) ? statusData[0] : null;

  if (status?.is_subscribed) {
    return {
      success: true,
      alreadySubscribed: true,
      unsubscribeToken: status.unsubscribe_token ?? undefined,
    };
  }

  // If exists but unsubscribed, re-subscribe via RPC
  if (status && !status.is_subscribed) {
    const { data: reactivateData, error: reactivateError } = await supabase.rpc('newsletter_reactivate', {
      p_email: normalizedEmail,
      p_user_id: userId,
    });

    if (reactivateError) {
      console.error('[Newsletter] Error re-subscribing:', reactivateError);
      return { success: false, error: 'marketing.newsletter.subscriptionFailed' };
    }

    const reactivateRow = Array.isArray(reactivateData) ? reactivateData[0] : reactivateData;

    return {
      success: true,
      alreadySubscribed: false,
      unsubscribeToken: reactivateRow?.unsubscribe_token ?? status.unsubscribe_token ?? undefined,
    };
  }

  // Insert new subscriber
  const { data: insertData, error: insertError } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email: normalizedEmail,
      user_id: userId,
      subscribed_at: new Date().toISOString(),
    })
    .select('id, unsubscribe_token')
    .maybeSingle();

  if (insertError || !insertData) {
    console.error('[Newsletter] Error inserting subscriber:', insertError);
    return { success: false, error: 'marketing.newsletter.subscriptionFailed' };
  }

  return {
    success: true,
    alreadySubscribed: false,
    unsubscribeToken: insertData?.unsubscribe_token ?? undefined,
  };
}

/**
 * Unsubscribe email from newsletter
 */
export async function unsubscribeFromNewsletter(
  email: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.rpc('newsletter_unsubscribe', {
    p_email: normalizedEmail,
    p_token: token,
  });

  if (error || data !== true) {
    console.error('[Newsletter] Error unsubscribing:', error);
    return { success: false, error: 'marketing.newsletter.unsubscribeFailed' };
  }

  return { success: true };
}

/**
 * Check if email is subscribed to newsletter
 */
export async function isSubscribed(email: string): Promise<boolean> {
  const supabase = await createServerSupabaseClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase.rpc('newsletter_is_subscribed', {
    p_email: normalizedEmail,
  });

  if (error) {
    console.error('[Newsletter] Error checking subscription:', error);
    return false;
  }

  const status = Array.isArray(data) ? data[0] : null;
  return Boolean(status?.is_subscribed);
}

/**
 * Get subscriber count (for admin dashboard)
 */
export async function getSubscriberCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();

  const { count, error } = await supabase
    .from('newsletter_subscribers')
    .select('id', { count: 'exact', head: true })
    .is('unsubscribed_at', null);

  if (error) {
    console.error('[Newsletter] Error getting subscriber count:', error);
    return 0;
  }

  return count || 0;
}
