import { getRequestConfig } from 'next-intl/server';

import { defaultLocale } from '@/i18n/routing';

export default getRequestConfig(async ({ locale }) => {
  const activeLocale = locale ?? defaultLocale;
  const messages = (await import(`../../messages/${activeLocale}.json`)).default;

  return {
    locale: activeLocale,
    messages,
  };
});
