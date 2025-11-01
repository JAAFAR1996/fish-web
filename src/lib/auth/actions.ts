'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { db } from '@server/db';
import { profiles, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import {
  createUser,
  authenticateUser,
  createSession,
  deleteSession,
  deleteAllUserSessions,
  updateUserPassword,
  getUserByEmail,
} from '@server/auth';
import { getCurrentUser } from '@server/middleware';
import { validateSignin, validateSignup } from '@/lib/auth/validation';

type AuthActionResult<T extends Record<string, unknown> = {}> =
  | ({ success: true } & T)
  | { success: false; error: string };

const SESSION_COOKIE_NAME = 'session';

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
    const existingUser = await getUserByEmail(payload.email);
    if (existingUser) {
      return { success: false, error: 'auth.errors.emailExists' };
    }

    const user = await createUser({
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
    });

    const sessionToken = await createSession(user.id);
    
    cookies().set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return { success: true };
  } catch (error: any) {
    if (error.message?.toLowerCase().includes('email')) {
      return { success: false, error: 'auth.errors.emailExists' };
    }
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
    const user = await authenticateUser(payload.email, payload.password);

    if (!user) {
      return { success: false, error: 'auth.errors.invalidCredentials' };
    }

    const sessionToken = await createSession(user.id);
    
    cookies().set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'auth.errors.unknownError' };
  }
}

export async function signOut(): Promise<void> {
  const sessionToken = cookies().get(SESSION_COOKIE_NAME)?.value;
  
  if (sessionToken) {
    await deleteSession(sessionToken);
  }
  
  cookies().delete(SESSION_COOKIE_NAME);
  redirect('/');
}

export async function updateProfile(payload: {
  fullName?: string | null;
  username?: string | null;
  phone?: string | null;
}): Promise<AuthActionResult<{ profile: Record<string, unknown> }>> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  try {
    const updates: any = {};
    if (payload.fullName !== undefined) updates.fullName = payload.fullName;
    if (payload.username !== undefined) updates.username = payload.username;
    if (payload.phone !== undefined) updates.phone = payload.phone;

    const [updatedProfile] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, user.id))
      .returning();

    if (payload.fullName !== undefined) {
      await db
        .update(users)
        .set({ fullName: payload.fullName })
        .where(eq(users.id, user.id));
    }

    return { success: true, profile: updatedProfile as Record<string, unknown> };
  } catch (error: any) {
    if (error.message?.toLowerCase().includes('duplicate') || 
        error.message?.toLowerCase().includes('unique')) {
      return { success: false, error: 'auth.errors.usernameExists' };
    }
    return { success: false, error: 'auth.errors.unknownError' };
  }
}

export async function updatePassword(payload: {
  newPassword: string;
}): Promise<AuthActionResult> {
  if (!payload.newPassword || payload.newPassword.length < 8) {
    return { success: false, error: 'auth.validation.passwordMin' };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  try {
    await updateUserPassword(user.id, payload.newPassword);
    await deleteAllUserSessions(user.id);
    
    const sessionToken = await createSession(user.id);
    cookies().set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: 'auth.errors.unknownError' };
  }
}

export async function deleteAccount(): Promise<AuthActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  try {
    await db.delete(users).where(eq(users.id, user.id));
    cookies().delete(SESSION_COOKIE_NAME);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'auth.errors.unknownError' };
  }
}
