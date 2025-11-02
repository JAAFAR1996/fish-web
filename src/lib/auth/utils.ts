import { db } from '@server/db';
import { profiles } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, requireAuth } from '@server/middleware';
import type { AuthUser } from '@server/auth';

import type { UserProfile } from '@/types';

/**
 * Returns the currently authenticated user or null if unauthenticated.
 * Always prefer this helper over getSession() when performing auth checks.
 */
export async function getUser(): Promise<AuthUser | null> {
  return getCurrentUser();
}

/**
 * Returns the active session user data.
 * @deprecated Use getUser() instead for consistency
 */
export async function getSession(): Promise<{ user: AuthUser | null } | null> {
  const user = await getCurrentUser();
  return user ? { user } : null;
}

/**
 * Ensures that a user is authenticated. Throws an error if not.
 * Useful in server components, route handlers, or server actions that
 * require a signed-in user.
 */
export async function requireUser(): Promise<AuthUser> {
  return requireAuth();
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

  return profile as unknown as UserProfile;
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
export async function requireAdmin(): Promise<AuthUser> {
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
