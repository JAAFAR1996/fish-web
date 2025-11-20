import type { Locale, Order, OrderItem } from '@/types';

import { formatCurrency } from '@/lib/utils';
import { db } from '@server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

import { getResend, FROM_EMAIL, SUPPORT_EMAIL } from './resend-client';
import { renderOrderConfirmationEmailEn } from './templates/order-confirmation-en';
import { renderOrderConfirmationEmailAr } from './templates/order-confirmation-ar';

function getEmailSubject(locale: Locale, orderNumber: string) {
  return locale === 'ar'
    ? `تأكيد الطلب - ${orderNumber}`
    : `Order Confirmation - ${orderNumber}`;
}

async function resolveRecipientEmail(order: Order): Promise<string | null> {
  if (order.user_id) {
    try {
      const [row] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, order.user_id))
        .limit(1);
      if (row?.email) {
        return row.email;
      }
    } catch (error) {
      console.error('Failed to fetch user email for order', error);
    }
  }

  return order.guest_email ?? null;
}

export async function sendOrderConfirmationEmail(
  order: Order,
  items: OrderItem[],
  locale: Locale,
  deliveryEstimate: string | null = null
): Promise<{ success: boolean; error?: string }> {
  const recipientEmail = await resolveRecipientEmail(order);

  if (!recipientEmail) {
    console.error('No recipient email available for order', order.id);
    return { success: false, error: 'checkout.errors.emailFailed' };
  }

  const formatAmount = (value: number) => formatCurrency(value, locale);
  const html =
    locale === 'ar'
      ? renderOrderConfirmationEmailAr({
          order,
          items,
          formatAmount,
          deliveryEstimate,
        })
      : renderOrderConfirmationEmailEn({
          order,
          items,
          formatAmount,
          deliveryEstimate,
        });

  const subject = getEmailSubject(locale, order.order_number);

  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: recipientEmail,
      subject,
      html,
      reply_to: SUPPORT_EMAIL,
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send order confirmation email', error);
    return { success: false, error: 'checkout.errors.emailFailed' };
  }
}
