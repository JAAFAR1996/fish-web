import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { db } from '@/../../server/db';
import { sessions, users } from '@/../../server/schema';
import { eq, and, gt, sql } from 'drizzle-orm';

const SESSION_COOKIE_NAME = 'auth_token';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

// Get JWT secret from environment
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
  return new TextEncoder().encode(secret);
}

export interface SessionData {
  userId: string;
  sessionId: string;
}

// Create a new session
export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  
  // Generate JWT token
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getJWTSecret());

  // Store session in database
  const [session] = await db.insert(sessions).values({
    userId,
    token,
    expiresAt: expiresAt.toISOString(),
  }).returning();

  // Set cookie
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

// Verify and get session
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    // Verify JWT
    const { payload } = await jwtVerify(token, getJWTSecret());
    const userId = payload.userId as string;

    if (!userId) {
      return null;
    }

    // Check if session exists in database and is not expired
    const now = new Date().toISOString();
    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.token, token),
          gt(sessions.expiresAt, now)
        )
      )
      .limit(1);

    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      sessionId: session.id,
    };
  } catch (error) {
    return null;
  }
}

// Delete session (logout)
export async function deleteSession(): Promise<void> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    // Delete from database
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  // Delete cookie
  cookieStore.delete(SESSION_COOKIE_NAME);
}

// Clean up expired sessions
export async function cleanupExpiredSessions(): Promise<void> {
  await db
    .delete(sessions)
    .where(sql`${sessions.expiresAt} < NOW()`);
}
