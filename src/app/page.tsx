import { redirect } from 'next/navigation';

import { defaultLocale } from '@/i18n/routing';

type SearchParams = Record<string, string | string[] | undefined>;

export default function RootPage({ searchParams }: { searchParams: SearchParams }) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === 'string') {
          params.append(key, entry);
        }
      });
      return;
    }

    if (typeof value === 'string') {
      params.append(key, value);
    }
  });

  const queryString = params.toString();
  const redirectTarget = queryString
    ? `/${defaultLocale}?${queryString}`
    : `/${defaultLocale}`;

  // TODO: Add browser locale detection using Accept-Language header.
  redirect(redirectTarget);
}
