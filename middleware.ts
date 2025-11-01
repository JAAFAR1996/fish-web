import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/auth/middleware';

const handleI18nRouting = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const authResponse = await updateSession(request);

  const authRedirect = authResponse.headers.get('location');
  if (authRedirect || authResponse.status !== 200) {
    return authResponse;
  }

  const authCookies = authResponse.cookies.getAll();
  const intlResponse = handleI18nRouting(request);

  const intlRedirect = intlResponse.headers.get('location');
  const rewrite = intlResponse.headers.get('x-middleware-rewrite');
  const middlewareNext = intlResponse.headers.get('x-middleware-next');

  let finalResponse: NextResponse;

  if (intlRedirect) {
    finalResponse = NextResponse.redirect(intlRedirect, intlResponse.status);
  } else {
    finalResponse = NextResponse.next({
      request: { headers: request.headers },
    });
    if (rewrite) {
      finalResponse.headers.set('x-middleware-rewrite', rewrite);
    }
    if (middlewareNext) {
      finalResponse.headers.set('x-middleware-next', middlewareNext);
    }
  }

  intlResponse.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === 'set-cookie' || lower === 'location' || lower === 'x-middleware-rewrite' || lower === 'x-middleware-next') {
      return;
    }
    finalResponse.headers.set(key, value);
  });

  intlResponse.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie);
  });

  authCookies.forEach((cookie) => {
    finalResponse.cookies.set(cookie);
  });

  return finalResponse;
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
