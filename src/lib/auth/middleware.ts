import { NextRequest, NextResponse } from 'next/server';

/**
 * Session management is now handled by JWT tokens in cookies.
 * This middleware is kept for compatibility but doesn't need to refresh sessions
 * like Supabase did.
 */
export async function updateSession(request: NextRequest) {
  return NextResponse.next({ request: { headers: request.headers } });
}
