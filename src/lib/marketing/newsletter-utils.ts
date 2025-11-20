import { randomUUID } from 'crypto';

import { db } from '@server/db';
import { newsletterSubscribers } from '@shared/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

import type { NewsletterSubscriber } from '@/types';

const toIsoString = (value: Date | string | null | undefined): string =>
  value instanceof Date ? value.toISOString() : value ?? new Date(0).toISOString();

type NewsletterSubscriberRow = typeof newsletterSubscribers.$inferSelect;

function transformNewsletterSubscriber(row: NewsletterSubscriberRow): NewsletterSubscriber {
  return {
    id: row.id,
    email: row.email,
    user_id: row.userId ?? null,
    subscribed_at: toIsoString(row.subscribedAt),
    unsubscribed_at: row.unsubscribedAt ? toIsoString(row.unsubscribedAt) : null,
    preferences: (row.preferences as NewsletterSubscriber['preferences']) ?? {},
    unsubscribe_token: row.unsubscribeToken,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  };
}

/**
 * Subscribe email to newsletter
 */
export async function subscribeToNewsletter(
  email: string,
  userId: string | null = null,
): Promise<{ success: boolean; alreadySubscribed?: boolean; unsubscribeToken?: string; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [existing] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, normalizedEmail))
      .limit(1);

    if (existing && existing.unsubscribedAt === null) {
      const subscriber = transformNewsletterSubscriber(existing);
      return {
        success: true,
        alreadySubscribed: true,
        unsubscribeToken: subscriber.unsubscribe_token,
      };
    }

    if (existing && existing.unsubscribedAt !== null) {
      const [reactivated] = await db
        .update(newsletterSubscribers)
        .set({
          unsubscribedAt: null,
          subscribedAt: new Date(),
          updatedAt: new Date(),
          userId,
        })
        .where(eq(newsletterSubscribers.email, normalizedEmail))
        .returning({ unsubscribeToken: newsletterSubscribers.unsubscribeToken });

      return {
        success: true,
        alreadySubscribed: false,
        unsubscribeToken:
          reactivated?.unsubscribeToken ?? existing.unsubscribeToken ?? undefined,
      };
    }

    const [inserted] = await db
      .insert(newsletterSubscribers)
      .values({
        email: normalizedEmail,
        userId,
        subscribedAt: new Date(),
        unsubscribeToken: randomUUID(),
      })
      .returning({ unsubscribeToken: newsletterSubscribers.unsubscribeToken });

    return {
      success: true,
      alreadySubscribed: false,
      unsubscribeToken: inserted?.unsubscribeToken ?? undefined,
    };
  } catch (error) {
    console.error('[Newsletter] Error subscribing email:', error);

    // Handle unique constraint violation (race condition)
    if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
      try {
        const [refetched] = await db
          .select()
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.email, normalizedEmail))
          .limit(1);

        if (refetched) {
          return {
            success: true,
            alreadySubscribed: true,
            unsubscribeToken: refetched.unsubscribeToken,
          };
        }
      } catch (refetchError) {
        console.error('[Newsletter] Error refetching after unique violation:', refetchError);
      }
    }

    return { success: false, error: 'marketing.newsletter.subscriptionFailed' };
  }
}

/**
 * Unsubscribe email from newsletter
 */
export async function unsubscribeFromNewsletter(
  email: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const updated = await db
      .update(newsletterSubscribers)
      .set({
        unsubscribedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(newsletterSubscribers.email, normalizedEmail),
          eq(newsletterSubscribers.unsubscribeToken, token),
        ),
      )
      .returning({ id: newsletterSubscribers.id });

    if (!updated.length) {
      return { success: false, error: 'marketing.newsletter.unsubscribeFailed' };
    }

    return { success: true };
  } catch (error) {
    console.error('[Newsletter] Error unsubscribing:', error);
    return { success: false, error: 'marketing.newsletter.unsubscribeFailed' };
  }
}

/**
 * Check if email is subscribed to newsletter
 */
export async function isSubscribed(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const [status] = await db
      .select({
        isSubscribed: sql<boolean>`${newsletterSubscribers.unsubscribedAt} IS NULL`,
      })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, normalizedEmail))
      .limit(1);

    return Boolean(status?.isSubscribed);
  } catch (error) {
    console.error('[Newsletter] Error checking subscription:', error);
    return false;
  }
}

/**
 * Get subscriber count (for admin dashboard)
 */
export async function getSubscriberCount(): Promise<number> {
  try {
    const [result] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(newsletterSubscribers)
      .where(isNull(newsletterSubscribers.unsubscribedAt));

    return result?.count ?? 0;
  } catch (error) {
    console.error('[Newsletter] Error getting subscriber count:', error);
    return 0;
  }
}
