'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import type { ThemeOption } from '@/types';
import { cn } from '@/lib/utils';

type ThemePreview = {
  key: ThemeOption;
  name: string;
  accent: string;
  bg: string;
  previewClass?: string;
};

const PREVIEWS: ThemePreview[] = [
  { key: 'light', name: 'Light', accent: '#0E8FA8', bg: '#f8fafc' },
  { key: 'dark', name: 'Dark', accent: '#1da2d8', bg: '#0b1724' },
  { key: 'neon-ocean', name: 'Neon Ocean', accent: '#00D9FF', bg: '#000000', previewClass: 'underwater-glow' },
  { key: 'monochrome', name: 'Monochrome', accent: '#0f172a', bg: '#ffffff' },
  { key: 'pastel', name: 'Pastel', accent: '#E0F2F1', bg: '#fdfefe' },
];

const setBodyDataTheme = (theme?: string) => {
  if (typeof document === 'undefined' || !theme) return;
  document.body.dataset.theme = theme;
};

export function ThemeSwitcher() {
  const { theme, setTheme, systemTheme, themes } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeTheme = useMemo<ThemeOption>(() => {
    if (!mounted) return 'light';
    if (theme === 'system') {
      return (systemTheme as ThemeOption) ?? 'light';
    }
    return (theme as ThemeOption) ?? 'light';
  }, [mounted, systemTheme, theme]);

  useEffect(() => {
    if (!mounted) return;
    setBodyDataTheme(activeTheme);
  }, [activeTheme, mounted]);

  if (!mounted) {
    return null;
  }

  const availableThemes = themes?.length ? themes : PREVIEWS.map((preview) => preview.key);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon name="sparkles" size="sm" />
        <span>Theme</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PREVIEWS.filter((preview) => availableThemes.includes(preview.key)).map((preview) => (
          <Card
            key={preview.key}
            role="button"
            tabIndex={0}
            onClick={() => setTheme(preview.key)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setTheme(preview.key);
              }
            }}
            className={cn(
              'relative overflow-hidden border transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
              activeTheme === preview.key && 'ring-2 ring-aqua-500 border-ring shadow-lg'
            )}
            style={{
              background: preview.bg,
            }}
            aria-pressed={activeTheme === preview.key}
          >
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">{preview.name}</p>
                <p className="text-xs text-muted-foreground">Tap to apply</p>
              </div>
              <span
                className="h-10 w-10 rounded-full shadow-inner"
                style={{ background: preview.accent }}
              />
            </div>
            <div
              className={cn(
                'h-16 w-full overflow-hidden rounded-t-lg bg-gradient-to-r from-black/5 via-transparent to-black/5',
                preview.previewClass
              )}
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, ${preview.accent}22, transparent 35%), radial-gradient(circle at 80% 30%, ${preview.accent}18, transparent 35%)`,
              }}
              aria-hidden
            />
          </Card>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Button
          size="sm"
          variant="ghost"
          className={cn('px-3', theme === 'system' && 'text-foreground font-semibold')}
          onClick={() => setTheme('system')}
        >
          <Icon name="settings" size="xs" className="me-2" />
          System
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={cn('px-3', activeTheme === 'light' && 'text-foreground font-semibold')}
          onClick={() => setTheme('light')}
        >
          Light
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={cn('px-3', activeTheme === 'dark' && 'text-foreground font-semibold')}
          onClick={() => setTheme('dark')}
        >
          Dark
        </Button>
      </div>
    </div>
  );
}
