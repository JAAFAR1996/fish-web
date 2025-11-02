import '@/app/globals.css';

import type { ReactNode } from 'react';

import { defaultLocale } from '@/i18n/routing';
import { getDirection } from '@/lib/utils';

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang={defaultLocale} dir={getDirection(defaultLocale)}>
      <body>{children}</body>
    </html>
  );
}
