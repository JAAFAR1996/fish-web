import { getResend, FROM_EMAIL, SUPPORT_EMAIL } from './resend-client';
import { renderShippingUpdateEmailEn } from './templates/shipping-update-en';
import { renderShippingUpdateEmailAr } from './templates/shipping-update-ar';
import { adminClient } from '@/lib/supabase/admin';
import type { Order, Locale } from '@/types';

interface SendShippingUpdateEmailParams {
  order: Order;
  trackingNumber: string;
  carrier: string;
  locale: Locale;
}

async function resolveRecipientEmail(order: Order): Promise<string | null> {
  if (order.user_id) {
    try {
      const { data, error } = await adminClient.auth.admin.getUserById(order.user_id);
      if (!error && data?.user?.email) {
        return data.user.email;
      }
    } catch (error) {
      console.error('Failed to fetch user email for shipping update', error);
    }
  }

  return order.guest_email ?? null;
}

export async function sendShippingUpdateEmail({
  order,
  trackingNumber,
  carrier,
  locale,
}: SendShippingUpdateEmailParams): Promise<{ success: boolean; error?: string }> {
  const recipientEmail = await resolveRecipientEmail(order);

  if (!recipientEmail) {
    console.error('No recipient email available for shipping update', order.id);
    return { success: false, error: 'checkout.errors.emailFailed' };
  }

  try {

    const subject = locale === 'ar' ? `تم شحن طلبك - ${order.order_number}` : `Your Order Has Shipped - ${order.order_number}`;

    const html =
      locale === 'ar'
        ? renderShippingUpdateEmailAr({ order, trackingNumber, carrier })
        : renderShippingUpdateEmailEn({ order, trackingNumber, carrier });

    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      html,
      replyTo: SUPPORT_EMAIL,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending shipping update email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
