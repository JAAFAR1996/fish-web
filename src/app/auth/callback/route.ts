import { NextRequest, NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server';

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
  const code = url.searchParams.get('code');
  const next = sanitizeNext(url.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(
      resolveRedirectUrl(request, '/auth/error?message=missing_code')
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      resolveRedirectUrl(request, '/auth/error?message=exchange_failed')
    );
  }

  return NextResponse.redirect(resolveRedirectUrl(request, next));
}
