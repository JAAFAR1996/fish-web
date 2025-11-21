import { defineRouting } from 'next-intl/routing';

export const defaultLocale = 'ar';

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale,
  // Always prefix locale to match the /[locale]/... route structure
  localePrefix: 'always',
});
