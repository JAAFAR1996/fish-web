'use server';

import { redirect } from 'next/navigation';
import { db } from '@/../../server/db';
import { users, profiles } from '@/../../server/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { createSession, deleteSession } from '@/lib/auth/session';
import { getUser } from '@/lib/auth/utils';
import { validateSignin, validateSignup } from '@/lib/auth/validation';

type AuthActionResult<T = void> = T extends void
  ? { success: true } | { success: false; error: string }
  : { success: true; data: T } | { success: false; error: string };

function sanitizeNext(next?: string | null) {
  if (!next || typeof next !== 'string') return '/account';
  if (!next.startsWith('/')) return '/account';
  return next === '/' ? '/account' : next;
}

export async function signUpWithEmail(payload: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  next?: string;
}): Promise<AuthActionResult> {
  const validation = validateSignup({
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
    confirmPassword: payload.confirmPassword,
  });

  if (!validation.valid) {
    const [, firstError] = Object.entries(validation.errors)[0];
    return { success: false, error: firstError };
  }

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, payload.email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return { success: false, error: 'auth.errors.emailExists' };
    }

    // Hash password
    const passwordHash = await hashPassword(payload.password);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email: payload.email.toLowerCase(),
        passwordHash,
        emailVerified: true, // Auto-verify for now
      })
      .returning();

    // Create profile
    await db.insert(profiles).values({
      id: newUser.id,
      fullName: payload.fullName,
    });

    // Create session
    await createSession(newUser.id);

    return { success: true };
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: 'auth.errors.unknownError' };
  }
}

export async function signInWithEmail(payload: {
  email: string;
  password: string;
  next?: string;
}): Promise<AuthActionResult> {
  const validation = validateSignin({
    email: payload.email,
    password: payload.password,
  });

  if (!validation.valid) {
    const [, firstError] = Object.entries(validation.errors)[0];
    return { success: false, error: firstError };
  }

  try {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, payload.email.toLowerCase()))
      .limit(1);

    if (!user) {
      return { success: false, error: 'auth.errors.invalidCredentials' };
    }

    // Verify password
    const isValid = await verifyPassword(payload.password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'auth.errors.invalidCredentials' };
    }

    // Create session
    await createSession(user.id);

    return { success: true };
  } catch (error) {
    console.error('Signin error:', error);
    return { success: false, error: 'auth.errors.unknownError' };
  }
}

export async function signOut(): Promise<void> {
  await deleteSession();
  redirect('/');
}

export async function updateProfile(payload: {
  fullName?: string | null;
  username?: string | null;
  phone?: string | null;
}): Promise<AuthActionResult<{ id: string }>> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  try {
    const updates: Record<string, string | null> = {};
    if (payload.fullName !== undefined) updates.fullName = payload.fullName;
    if (payload.username !== undefined) updates.username = payload.username;
    if (payload.phone !== undefined) updates.phone = payload.phone;

    const [profile] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, user.id))
      .returning();

    return { success: true, data: { id: profile.id } };
  } catch (error: any) {
    if (error?.message?.includes('unique') || error?.code === '23505') {
      return { success: false, error: 'auth.errors.usernameExists' };
    }
    console.error('Update profile error:', error);
    return { success: false, error: 'auth.errors.unknownError' };
  }
}

export async function updatePassword(payload: {
  newPassword: string;
}): Promise<AuthActionResult> {
  if (!payload.newPassword || payload.newPassword.length < 8) {
    return { success: false, error: 'auth.validation.passwordMin' };
  }

  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  try {
    const passwordHash = await hashPassword(payload.newPassword);
    
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id));

    return { success: true };
  } catch (error) {
    console.error('Update password error:', error);
    return { success: false, error: 'auth.errors.unknownError' };
  }
}

export async function deleteAccount(): Promise<AuthActionResult> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  try {
    // Delete user (profiles and sessions will cascade)
    await db.delete(users).where(eq(users.id, user.id));
    
    // Clear session
    await deleteSession();

    return { success: true };
  } catch (error) {
    console.error('Delete account error:', error);
    return { success: false, error: 'auth.errors.unknownError' };
  }
}
