'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import type { ReactNode } from 'react';

type Props = ThemeProviderProps & {
  children: ReactNode;
};

export function ThemeProvider({ children, ...props }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="fish-web-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
