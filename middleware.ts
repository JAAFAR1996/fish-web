import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { wrapMiddlewareWithSentry } from '@sentry/nextjs';

import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/auth/middleware';

const handleI18nRouting = createMiddleware(routing);

const REQUEST_ID_HEADER = 'x-request-id';
const CSP_NONCE_HEADER = 'x-csp-nonce';
const CSP_REPORT_GROUP = 'csp-endpoint';
const CSP_REPORT_URI = '/api/security/csp-report';

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return Buffer.from(bytes).toString('base64');
}

function cloneRequestWithHeaders(request: NextRequest, headers: Headers): NextRequest {
  const cloned = new Request(request, { headers });
  return new NextRequest(cloned);
}

function createBaseResponse(
  sourceResponse: NextResponse,
  requestHeaders: Headers
): NextResponse {
  const location = sourceResponse.headers.get('location');
  const rewrite = sourceResponse.headers.get('x-middleware-rewrite');
  const middlewareNext = sourceResponse.headers.get('x-middleware-next');
  const status = sourceResponse.status;

  if (location) {
    return NextResponse.redirect(location, status);
  }

  const baseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (rewrite) {
    baseResponse.headers.set('x-middleware-rewrite', rewrite);
  }

  if (middlewareNext) {
    baseResponse.headers.set('x-middleware-next', middlewareNext);
  }

  return baseResponse;
}

function applySecurityHeaders(
  response: NextResponse,
  cspNonce: string,
  requestId: string
) {
  const reportOnly = process.env.NODE_ENV !== 'production';
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' https://plausible.io 'nonce-${cspNonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://plausible.io https://o*.ingest.sentry.io https://*.sentry.io",
    "font-src 'self' https://fonts.gstatic.com",
    "frame-ancestors 'self'",
    `report-uri ${CSP_REPORT_URI}`,
    `report-to ${CSP_REPORT_GROUP}`,
  ].join('; ');

  response.headers.set(REQUEST_ID_HEADER, requestId);
  response.headers.set(CSP_NONCE_HEADER, cspNonce);
  response.headers.set(
    'Report-To',
    JSON.stringify({
      group: CSP_REPORT_GROUP,
      max_age: 10886400,
      endpoints: [{ url: CSP_REPORT_URI }],
    })
  );

  if (reportOnly) {
    response.headers.set('Content-Security-Policy-Report-Only', cspDirectives);
    response.headers.delete('Content-Security-Policy');
  } else {
    response.headers.set('Content-Security-Policy', cspDirectives);
    response.headers.delete('Content-Security-Policy-Report-Only');
  }
}

async function middleware(request: NextRequest) {
  const { pathname, protocol } = request.nextUrl;

  // Enforce HTTPS in production
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (
    process.env.NODE_ENV === 'production' &&
    (protocol === 'http:' || forwardedProto === 'http')
  ) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 308);
  }
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/images/')
  ) {
    return NextResponse.next();
  }

  const headers = new Headers(request.headers);
  const existingRequestId = headers.get(REQUEST_ID_HEADER);
  const requestId = existingRequestId ?? crypto.randomUUID();
  headers.set(REQUEST_ID_HEADER, requestId);

  const cspNonce = generateNonce();
  headers.set(CSP_NONCE_HEADER, cspNonce);

  const enhancedRequest = cloneRequestWithHeaders(request, headers);

  const authResponse = await updateSession(enhancedRequest);

  const authRedirect = authResponse.headers.get('location');
  if (authRedirect || authResponse.status !== 200) {
    applySecurityHeaders(authResponse, cspNonce, requestId);
    return authResponse;
  }

  const authCookies = authResponse.cookies.getAll();
  const intlResponse = handleI18nRouting(enhancedRequest);

  const finalResponse = createBaseResponse(intlResponse, headers);

  authResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      return;
    }
    finalResponse.headers.set(key, value);
  });

  intlResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      return;
    }
    finalResponse.headers.set(key, value);
  });

  authCookies.forEach((cookie) => {
    finalResponse.cookies.set(cookie);
  });

  intlResponse.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie);
  });

  applySecurityHeaders(finalResponse, cspNonce, requestId);

  return finalResponse;
}

export default wrapMiddlewareWithSentry(middleware);

export const config = {
  matcher: ['/:path*'],
};
