import { NextRequest, NextResponse } from 'next/server';

const CONTROL_CHARACTERS_REGEX = /[\u0000-\u001F\u007F]/;
const ALLOWED_PATH_PREFIXES = [
  '/',
  '/ar',
  '/en',
  '/account',
  '/products',
  '/cart',
  '/wishlist',
  '/orders',
];

function sanitizeNext(next?: string | null) {
  if (!next || typeof next !== 'string') return '/account';

  const trimmed = next.trim();
  if (!trimmed.startsWith('/')) return '/account';
  if (trimmed.startsWith('//')) return '/account';
  if (CONTROL_CHARACTERS_REGEX.test(trimmed)) return '/account';
  if (trimmed.includes(':/')) return '/account';

  const normalized = trimmed.replace(/\/{2,}/g, '/');
  if (!normalized || normalized === '.') return '/account';

  const isAllowed = ALLOWED_PATH_PREFIXES.some((prefix) => {
    if (prefix === '/') return normalized === '/';
    return normalized === prefix || normalized.startsWith(`${prefix}/`);
  });

  if (!isAllowed) {
    return '/account';
  }

  return normalized;
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
  const next = sanitizeNext(url.searchParams.get('next'));
  const errorRedirect = `/auth/error?message=oauth_not_configured&next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(resolveRedirectUrl(request, errorRedirect));
}
