import { getResend, FROM_EMAIL, SUPPORT_EMAIL } from './resend-client';
import type { Locale } from '@/types';
import { renderNewsletterWelcomeEmailAr } from './templates/newsletter-welcome-ar';
import { renderNewsletterWelcomeEmailEn } from './templates/newsletter-welcome-en';

/**
 * Get localized newsletter welcome email subject
 */
function getNewsletterWelcomeSubject(locale: Locale): string {
  return locale === 'ar'
    ? 'مرحباً بك في نشرة FISH WEB!'
    : 'Welcome to FISH WEB Newsletter!';
}

/**
 * Send newsletter welcome email
 */
export async function sendNewsletterWelcomeEmail(
  email: string,
  locale: Locale,
  unsubscribeToken?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate email
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }

    // Select template based on locale
    const subject = getNewsletterWelcomeSubject(locale);
    const html = locale === 'ar'
      ? renderNewsletterWelcomeEmailAr({ email, unsubscribeToken })
      : renderNewsletterWelcomeEmailEn({ email, unsubscribeToken });

    // Send email using Resend
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      replyTo: SUPPORT_EMAIL,
    });

    if (error) {
      console.error('[Newsletter] Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    console.log(`[Newsletter] Welcome email sent to ${email} (${data?.id})`);
    return { success: true };
  } catch (error) {
    console.error('[Newsletter] Unexpected error sending welcome email:', error);
    return { success: false, error: 'Failed to send welcome email' };
  }
}
