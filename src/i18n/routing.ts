import { defineRouting } from 'next-intl/routing';

export const defaultLocale = 'ar';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale,
  localePrefix: 'as-needed',
});
