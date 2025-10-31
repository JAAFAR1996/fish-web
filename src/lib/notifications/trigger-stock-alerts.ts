import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendBulkStockAlerts } from '@/lib/email/send-stock-alert';
import { createNotification } from './notification-queries';
import type { Product, Locale, StockAlertData } from '@/types';

export async function triggerBackInStockAlerts(
  product: Product
): Promise<{ emailsSent: number; notificationsCreated: number }> {
  const supabase = await createServerSupabaseClient();

  try {
    // Query notify_me_requests for this product where not notified
    const { data: requests, error } = await supabase
      .from('notify_me_requests')
      .select('*')
      .eq('product_id', product.id)
      .eq('notified', false);

    if (error) {
      console.error('Error fetching notify_me_requests:', error);
      return { emailsSent: 0, notificationsCreated: 0 };
    }

    if (!requests || requests.length === 0) {
      return { emailsSent: 0, notificationsCreated: 0 };
    }

    // Determine locale for each recipient (default to 'en')
    const recipients = requests.map((req) => ({
      email: req.email,
      locale: 'en' as Locale, // TODO: Get actual user locale from profiles if user_id exists
      userId: req.user_id,
      requestId: req.id,
    }));

    // Build product URL
    const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://fishweb.iq'}/products/${product.slug}`;

    // Send emails in bulk
    const emailRecipients = recipients
      .filter((r) => r.email)
      .map((r) => ({ email: r.email!, locale: r.locale }));

    const { successCount } = await sendBulkStockAlerts(emailRecipients, product, productUrl);

    // Create in-app notifications for users (not guests)
    const notificationData: StockAlertData = {
      type: 'stock_alert',
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      thumbnail: product.thumbnail,
      price: product.price,
    };

    let notificationsCreated = 0;
    for (const recipient of recipients) {
      if (recipient.userId) {
        const notification = await createNotification(
          recipient.userId,
          'stock_alert',
          `${product.name} is back in stock!`,
          `The product you wanted is now available. Order soon before it sells out again!`,
          notificationData,
          `/products/${product.slug}`
        );
        if (notification) {
          notificationsCreated++;
        }
      }
    }

    // Update notified = true for processed requests
    const requestIds = requests.map((r) => r.id);
    await supabase
      .from('notify_me_requests')
      .update({ notified: true })
      .in('id', requestIds);

    return { emailsSent: successCount, notificationsCreated };
  } catch (error) {
    console.error('Error triggering back-in-stock alerts:', error);
    return { emailsSent: 0, notificationsCreated: 0 };
  }
}
