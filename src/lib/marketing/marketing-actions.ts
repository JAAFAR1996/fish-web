'use server';
import { getUser } from '@/lib/auth/utils';
import { subscribeToNewsletter } from './newsletter-utils';
import { validatePointsRedemption, calculatePointsDiscount } from './loyalty-helpers';
import { getUserPointsBalance } from './loyalty-utils';
import { sendNewsletterWelcomeEmail } from '@/lib/email/send-newsletter-welcome';
import type { Locale } from '@/types';

/**
 * Subscribe to newsletter action
 */
export async function subscribeToNewsletterAction(
  email: string,
  locale: Locale
): Promise<{ success: boolean; alreadySubscribed?: boolean; error?: string }> {
  try {
    // Get current user (optional - newsletter works for guests too)
    const user = await getUser();
    const userId = user?.id ?? null;

    // Subscribe to newsletter
    const result = await subscribeToNewsletter(email, userId);
    const { unsubscribeToken, ...response } = result;

    if (response.success && !response.alreadySubscribed) {
      console.log(`[Newsletter] New subscription: ${email}`);
      // Send welcome email on the server
      await sendNewsletterWelcomeEmail(email, locale, unsubscribeToken);
    }

    return response;
  } catch (error) {
    console.error('[Newsletter] Error in subscription action:', error);
    return { success: false, error: 'marketing.newsletter.subscriptionFailed' };
  }
}

/**
 * Redeem loyalty points action (validates redemption)
 * Note: Actual points deduction happens in order creation
 */
export async function redeemLoyaltyPointsAction(
  points: number,
  orderSubtotal: number
): Promise<{ success: boolean; discount?: number; error?: string }> {
  try {
    // Get current user (required for loyalty points)
    const user = await getUser();
    if (!user) {
      return { success: false, error: 'auth.loginRequired' };
    }

    // Get points balance
    const balance = await getUserPointsBalance(user.id);

    // Validate redemption
    const validation = validatePointsRedemption(points, balance, orderSubtotal);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Calculate discount
    const discount = calculatePointsDiscount(points);

    return { success: true, discount };
  } catch (error) {
    console.error('[Loyalty] Error in redemption action:', error);
    return { success: false, error: 'loyalty.redemptionFailed' };
  }
}
