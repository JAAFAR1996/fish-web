'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import crypto from 'crypto';

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
  verifyUserEmail,
  type AuthUser,
} from '@server/auth';
import { getCurrentUser } from '@server/middleware';
import { validateSignin, validateSignup } from '@/lib/auth/validation';
import type {
  AuthActionResult,
  AuthActionProfileResult,
  ProfileUpdates,
  SignInPayload,
  SignUpPayload,
  UpdatePasswordPayload,
} from '@/types/auth';

const SESSION_COOKIE_NAME = 'session';
const DEFAULT_REDIRECT = '/account';
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

function setSessionCookie(token: string): void {
  cookies().set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

function validateRedirectPath(path?: string | null): string {
  if (!path || typeof path !== 'string' || !path.startsWith('/')) {
    return DEFAULT_REDIRECT;
  }
  return path === '/' ? DEFAULT_REDIRECT : path;
}


export async function signUpWithEmail(
  payload: SignUpPayload
): Promise<AuthActionResult<{ redirect: string }>> {
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
    setSessionCookie(sessionToken);

    return {
      success: true,
      redirect: validateRedirectPath(payload.next),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.toLowerCase().includes('email')) {
      return { success: false, error: 'auth.errors.emailExists' };
    }
    return { success: false, error: 'auth.errors.unknownError' };
  }
}

export async function signInWithEmail(
  payload: SignInPayload
): Promise<AuthActionResult<{ redirect: string }>> {
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
    setSessionCookie(sessionToken);

    return {
      success: true,
      redirect: validateRedirectPath(payload.next),
    };
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

export async function updateProfile(
  payload: ProfileUpdates
): Promise<AuthActionProfileResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  try {
    const updates = {
      ...(payload.fullName !== undefined && { fullName: payload.fullName }),
      ...(payload.username !== undefined && { username: payload.username }),
      ...(payload.phone !== undefined && { phone: payload.phone }),
    };

    const [updatedProfile] = await db
      .update(profiles)
      .set(updates)
      .where(eq(profiles.id, user.id))
      .returning();

    if ('fullName' in updates) {
      await db
        .update(users)
        .set({ fullName: updates.fullName })
        .where(eq(users.id, user.id));
    }

    return {
      success: true,
      profile: {
        id: updatedProfile.id,
        username: updatedProfile.username,
        full_name: updatedProfile.fullName,
        avatar_url: updatedProfile.avatarUrl,
        phone: updatedProfile.phone,
        is_admin: Boolean(updatedProfile.isAdmin),
        loyalty_points_balance: Number(updatedProfile.loyaltyPointsBalance ?? 0),
        referral_code: updatedProfile.referralCode,
        referred_by: updatedProfile.referredBy,
        created_at:
          updatedProfile.createdAt instanceof Date
            ? updatedProfile.createdAt.toISOString()
            : updatedProfile.createdAt ?? new Date().toISOString(),
        updated_at:
          updatedProfile.updatedAt instanceof Date
            ? updatedProfile.updatedAt.toISOString()
            : updatedProfile.updatedAt ?? new Date().toISOString(),
      },
    };
  } catch (error) {
    const errorMessage = (
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
    );
    if (errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
      return { success: false, error: 'auth.errors.usernameExists' };
    }
    return { success: false, error: 'auth.errors.unknownError' };
  }
}

export async function updatePassword(
  payload: UpdatePasswordPayload
): Promise<AuthActionResult> {
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
    setSessionCookie(sessionToken);

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

export async function getCurrentUserAction(): Promise<{
  id: string;
  email: string;
  fullName: string | null;
  emailVerified: boolean;
  profile: {
    fullName: string | null;
    avatarUrl: string | null;
    loyaltyPointsBalance: number;
  } | null;
} | null> {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return null;
    }

    const [profile] = await db
      .select({
        fullName: profiles.fullName,
        avatarUrl: profiles.avatarUrl,
        loyaltyPointsBalance: profiles.loyaltyPointsBalance,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      emailVerified: user.emailVerified,
      profile: profile
        ? {
            fullName: profile.fullName ?? null,
            avatarUrl: profile.avatarUrl ?? null,
            loyaltyPointsBalance: Number(profile.loyaltyPointsBalance ?? 0),
          }
        : null,
    };
  } catch (error) {
    return null;
  }
}
