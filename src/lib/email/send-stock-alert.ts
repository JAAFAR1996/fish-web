import { getResend, FROM_EMAIL, SUPPORT_EMAIL } from './resend-client';
import { renderStockAlertEmailEn } from './templates/stock-alert-en';
import { renderStockAlertEmailAr } from './templates/stock-alert-ar';
import type { Product, Locale } from '@/types';

interface SendBackInStockEmailParams {
  email: string;
  product: Product;
  locale: Locale;
  productUrl: string;
}

interface BulkRecipient {
  email: string;
  locale: Locale;
}

export function formatAmount(value: number): string {
  return new Intl.NumberFormat('en-IQ', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(value) + ' IQD';
}

export async function sendBackInStockEmail({
  email,
  product,
  locale,
  productUrl,
}: SendBackInStockEmailParams): Promise<{ success: boolean; error?: string }> {
  try {
    const subject = locale === 'ar' ? `${product.name} متوفر الآن!` : `${product.name} is Back in Stock!`;

    const html =
      locale === 'ar'
        ? renderStockAlertEmailAr({ product, productUrl, formatAmount })
        : renderStockAlertEmailEn({ product, productUrl, formatAmount });

    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject,
      html,
      replyTo: SUPPORT_EMAIL,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending stock alert email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendBulkStockAlerts(
  recipients: BulkRecipient[],
  product: Product,
  productUrl: string
): Promise<{ successCount: number; failureCount: number }> {
  const results = await Promise.allSettled(
    recipients.map((recipient) =>
      sendBackInStockEmail({
        email: recipient.email,
        product,
        locale: recipient.locale,
        productUrl,
      })
    )
  );

  const successCount = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
  const failureCount = results.length - successCount;

  return { successCount, failureCount };
}
