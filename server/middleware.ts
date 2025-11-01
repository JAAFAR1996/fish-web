import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { verifySession, getUserById, AuthUser } from './auth';
import { cookies } from 'next/headers';

// This module uses next/headers and can only be imported in Server Components,
// Server Actions, or API Routes. Do not import in Client Components.

const SESSION_COOKIE_NAME = 'session';

export async function getSessionFromRequest(request?: NextRequest): Promise<string | null> {
  if (request) {
    return request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
  }
  
  const cookieStore = cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value || null;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const sessionToken = await getSessionFromRequest();
  
  if (!sessionToken) {
    return null;
  }

  const session = await verifySession(sessionToken);
  if (!session) {
    return null;
  }

  return getUserById(session.userId);
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
}
