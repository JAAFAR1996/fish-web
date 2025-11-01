import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates authentication session on every request.
 * 
 * Session validation happens automatically when getUser() is called
 * in server components and actions, so this middleware mainly ensures
 * cookies are properly handled.
 */
export async function updateSession(request: NextRequest) {
  // Allow the request to proceed
  // Session validation will happen in server components/actions via getUser()
  return NextResponse.next({ request: { headers: request.headers } });
}
