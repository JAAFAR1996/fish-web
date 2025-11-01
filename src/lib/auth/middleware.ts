import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/env';

/**
 * Refreshes the Supabase authentication session on every request.
 *
 * Following Supabase's Next.js App Router guidance we always call getUser()
 * which validates the JWT with Supabase and transparently refreshes tokens.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Parameters<typeof response.cookies.set>[1]) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: Parameters<typeof response.cookies.set>[1]) {
          response.cookies.set({
            name,
            value: '',
            ...options,
            maxAge: 0,
          });
        },
      },
    }
  );

  // We purposefully ignore the result – if the user is unauthenticated
  // getUser() will simply return null without throwing.
  await supabase.auth.getUser();

  return response;
}
