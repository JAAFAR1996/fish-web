import type { User, Session } from '@supabase/supabase-js';

import { createServerSupabaseClient } from '@/lib/supabase/server';

import type { UserProfile } from '@/types';

/**
 * Returns the currently authenticated Supabase user or null if unauthenticated.
 * Always prefer this helper over getSession() when performing auth checks.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user ?? null;
}

/**
 * Returns the active Supabase session. Use for reading session data only.
 * For auth checks prefer getUser() which validates the JWT with Supabase.
 */
export async function getSession(): Promise<Session | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    return null;
  }

  return data.session ?? null;
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
 * Fetches the profile row associated with a Supabase auth user.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single<UserProfile>();

  if (error) {
    return null;
  }

  return data ?? null;
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
