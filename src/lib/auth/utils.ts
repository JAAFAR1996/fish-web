import { db } from '@/../../server/db';
import { users, profiles } from '@/../../server/schema';
import { eq } from 'drizzle-orm';
import { getSession as getSessionData } from '@/lib/auth/session';

import type { UserProfile } from '@/types';

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface Session {
  user: User;
  sessionId: string;
}

/**
 * Returns the currently authenticated user or null if unauthenticated.
 * Always prefer this helper over getSession() when performing auth checks.
 */
export async function getUser(): Promise<User | null> {
  const session = await getSessionData();

  if (!session) {
    return null;
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  return user || null;
}

/**
 * Returns the active session. Use for reading session data only.
 * For auth checks prefer getUser() which validates the session.
 */
export async function getSession(): Promise<Session | null> {
  const sessionData = await getSessionData();

  if (!sessionData) {
    return null;
  }

  const user = await getUser();

  if (!user) {
    return null;
  }

  return {
    user,
    sessionId: sessionData.sessionId,
  };
}

/**
 * Ensures that a user is authenticated. Throws an error if not.
 * Useful in server components, route handlers, or server actions that
 * require a signed-in user.
 */
export async function requireUser(): Promise<User> {
  const user = await getUser();

  if (!user) {
    throw new Error('User must be authenticated');
  }

  return user;
}

/**
 * Fetches the profile row associated with an auth user.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    username: profile.username,
    full_name: profile.fullName,
    avatar_url: profile.avatarUrl,
    phone: profile.phone,
    loyalty_points_balance: profile.loyaltyPointsBalance,
    referral_code: profile.referralCode,
    referred_by: profile.referredBy,
    is_admin: profile.isAdmin,
    email_order_updates: profile.emailOrderUpdates,
    email_shipping_updates: profile.emailShippingUpdates,
    email_stock_alerts: profile.emailStockAlerts,
    email_marketing: profile.emailMarketing,
    inapp_notifications_enabled: profile.inappNotificationsEnabled,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
  } as UserProfile;
}

/**
 * Convenience helper returning true when a user is authenticated.
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getUser();
  return Boolean(user);
}

/**
 * Ensures the current user has admin privileges.
 * Throws if no authenticated admin user exists.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  const profile = await getUserProfile(user.id);

  if (!profile || profile.is_admin !== true) {
    throw new Error('Admin access required');
  }

  return user;
}

/**
 * Returns true if the current session belongs to an admin user.
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getUser();

  if (!user) {
    return false;
  }

  const profile = await getUserProfile(user.id);
  return profile?.is_admin === true;
}

/**
 * Returns the admin profile for the current session or null.
 * Throws if the user is not authenticated or lacks admin privileges.
 */
export async function getAdminProfile(): Promise<UserProfile | null> {
  const user = await requireAdmin();
  return getUserProfile(user.id);
}
