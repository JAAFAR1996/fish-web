import { NextRequest, NextResponse } from 'next/server';

import { db } from '@server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { createSession } from '@server/auth';
import { setSessionCookie } from '@server/middleware';

function sanitizeNext(next?: string | null) {
  if (!next || typeof next !== 'string') return '/account';
  if (!next.startsWith('/')) return '/account';
  return next;
}

function resolveRedirectUrl(request: NextRequest, path: string) {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https';
  const baseUrl = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : request.nextUrl.origin;

  return new URL(path, baseUrl).toString();
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') ?? url.searchParams.get('token_hash');
  const next = sanitizeNext(url.searchParams.get('next'));

  if (!token) {
    return NextResponse.redirect(
      resolveRedirectUrl(request, '/auth/error?message=verification_failed'),
    );
  }

  const [userRow] = await db
    .select({ id: users.id, emailVerified: users.emailVerified })
    .from(users)
    .where(eq(users.verificationToken, token))
    .limit(1);

  if (!userRow) {
    return NextResponse.redirect(
      resolveRedirectUrl(request, '/auth/error?message=verification_failed'),
    );
  }

  await db
    .update(users)
    .set({ emailVerified: true, verificationToken: null })
    .where(eq(users.id, userRow.id));

  const sessionToken = await createSession(userRow.id);
  const response = NextResponse.redirect(resolveRedirectUrl(request, next));
  setSessionCookie(response, sessionToken);
  return response;
}
