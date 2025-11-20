import { db } from '@server/db';
import { notifyMeRequests } from '@shared/schema';
import { and, eq, inArray } from 'drizzle-orm';

import { sendBulkStockAlerts } from '@/lib/email/send-stock-alert';
import { createNotification } from './notification-queries';
import type {
  Locale,
  NotifyMeRequest,
  Product,
  StockAlertData,
} from '@/types';

const toIsoString = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : value ?? new Date(0).toISOString();

type NotifyMeRequestRow = typeof notifyMeRequests.$inferSelect;

function transformNotifyMeRequest(row: NotifyMeRequestRow): NotifyMeRequest {
  return {
    id: row.id,
    product_id: row.productId,
    email: row.email ?? null,
    user_id: row.userId ?? null,
    notified: Boolean(row.notified),
    created_at: toIsoString(row.createdAt),
  };
}

export async function triggerBackInStockAlerts(
  product: Product,
): Promise<{ emailsSent: number; notificationsCreated: number }> {
  try {
    const rows = await db
      .select()
      .from(notifyMeRequests)
      .where(
        and(
          eq(notifyMeRequests.productId, product.id),
          eq(notifyMeRequests.notified, false),
        ),
      );

    const requests = rows.map(transformNotifyMeRequest);

    if (!requests.length) {
      return { emailsSent: 0, notificationsCreated: 0 };
    }

    const recipients = requests.map((req) => ({
      email: req.email,
      locale: 'en' as Locale,
      userId: req.user_id,
      requestId: req.id,
    }));

    const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fishweb.iq'}/products/${product.slug}`;

    const successfulRequestIds: string[] = [];

    // Send email alerts and track successes
    const emailRecipients = recipients.filter((recipient) => recipient.email);

    const emailResults = await Promise.allSettled(
      emailRecipients.map((recipient) =>
        sendBulkStockAlerts(
          [{ email: recipient.email as string, locale: recipient.locale }],
          product,
          productUrl
        ).then((result) => ({ ...result, requestId: recipient.requestId }))
      )
    );

    let emailsSent = 0;
    for (const result of emailResults) {
      if (result.status === 'fulfilled' && result.value.successCount > 0) {
        emailsSent += 1;
        successfulRequestIds.push(result.value.requestId);
      }
    }

    const notificationData: StockAlertData = {
      type: 'stock_alert',
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      thumbnail: product.thumbnail,
      price: product.price,
    };

    let notificationsCreated = 0;

    // Send in-app notifications and track successes
    for (const recipient of recipients) {
      if (!recipient.userId) {
        continue;
      }

      const notification = await createNotification(
        recipient.userId,
        'stock_alert',
        `${product.name} is back in stock!`,
        'The product you wanted is now available. Order soon before it sells out again!',
        notificationData,
        `/products/${product.slug}`,
      );

      if (notification) {
        notificationsCreated += 1;
        // Only add to successful list if not already added via email
        if (!successfulRequestIds.includes(recipient.requestId)) {
          successfulRequestIds.push(recipient.requestId);
        }
      }
    }

    // Only mark successful requests as notified
    if (successfulRequestIds.length > 0) {
      await db
        .update(notifyMeRequests)
        .set({ notified: true })
        .where(inArray(notifyMeRequests.id, successfulRequestIds));
    }

    return { emailsSent, notificationsCreated };
  } catch (error) {
    console.error('Error triggering back-in-stock alerts:', error);
    return { emailsSent: 0, notificationsCreated: 0 };
  }
}
