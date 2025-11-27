'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import type { ReactNode } from 'react';

type Props = ThemeProviderProps & {
  children: ReactNode;
};

const ThemeSync = () => {
  const { resolvedTheme } = useTheme();

  if (typeof document !== 'undefined' && resolvedTheme) {
    document.body.dataset.theme = resolvedTheme;
  }

  return null;
};

export function ThemeProvider({ children, ...props }: Props) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="fish-web-theme"
      themes={['light', 'dark', 'neon-ocean', 'monochrome', 'pastel', 'system']}
      {...props}
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}
