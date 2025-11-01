import { NextRequest } from 'next/server';
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

  const finalResponse = intlResponse;

  authCookies.forEach((cookie) => {
    finalResponse.cookies.set(cookie);
  });

  return finalResponse;
}

export const config = {
  matcher: ['/(?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).+'],
};
