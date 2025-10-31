'use server';

import { redirect } from 'next/navigation';

import { adminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/auth/utils';
import { validateSignin, validateSignup } from '@/lib/auth/validation';

type AuthActionResult<T extends Record<string, unknown> = Record<string, never>> =
  | ({ success: true } & T)
  | { success: false; error: string };

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

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        full_name: payload.fullName,
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('email')) {
      return { success: false, error: 'auth.errors.emailExists' };
    }
    return { success: false, error: 'auth.errors.unknownError' };
  }

  return { success: true };
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

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: payload.email,
    password: payload.password,
  });

  if (error) {
    if (error.message.toLowerCase().includes('email') || error.message.toLowerCase().includes('password')) {
      return { success: false, error: 'auth.errors.invalidCredentials' };
    }
    if (error.message.toLowerCase().includes('confirmed')) {
      return { success: false, error: 'auth.errors.emailNotConfirmed' };
    }
    return { success: false, error: 'auth.errors.unknownError' };
  }

  return { success: true };
}

export async function signOut(): Promise<void> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function updateProfile(payload: {
  fullName?: string | null;
  username?: string | null;
  phone?: string | null;
}): Promise<AuthActionResult<{ profile: Record<string, unknown> }>> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  const supabase = await createServerSupabaseClient();
  const updates = {
    full_name: payload.fullName ?? null,
    username: payload.username ?? null,
    phone: payload.phone ?? null,
  };

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) {
    if (error.message.toLowerCase().includes('duplicate')) {
      return { success: false, error: 'auth.errors.usernameExists' };
    }
    return { success: false, error: 'auth.errors.unknownError' };
  }

  return { success: true, profile: data ?? {} };
}

export async function updatePassword(payload: {
  newPassword: string;
}): Promise<AuthActionResult> {
  if (!payload.newPassword || payload.newPassword.length < 8) {
    return { success: false, error: 'auth.validation.passwordMin' };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.updateUser({
    password: payload.newPassword,
  });

  if (error) {
    return { success: false, error: 'auth.errors.unknownError' };
  }

  return { success: true };
}

export async function deleteAccount(): Promise<AuthActionResult> {
  const user = await getUser();
  if (!user) {
    return { success: false, error: 'auth.errors.unauthenticated' };
  }

  const { error } = await adminClient.auth.admin.deleteUser(user.id);
  if (error) {
    return { success: false, error: 'auth.errors.unknownError' };
  }

  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  return { success: true };
}
