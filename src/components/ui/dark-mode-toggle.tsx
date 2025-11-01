'use client';

import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';

import { cn } from '@/lib/utils';

import { Button } from './button';
import { Icon } from './icon';
import type { Size } from './variants';

type DarkModeToggleVariant = 'icon' | 'button';

const ICON_WRAPPER_SIZE: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const ICON_BUTTON_SIZES: Record<Size, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export interface DarkModeToggleProps {
  variant?: DarkModeToggleVariant;
  size?: Size;
  showLabel?: boolean;
  className?: string;
}

export function DarkModeToggle({
  variant = 'icon',
  size = 'md',
  showLabel = false,
  className,
}: DarkModeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = useMemo(() => resolvedTheme === 'dark', [resolvedTheme]);
  const nextTheme = isDark ? 'light' : 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  if (!mounted) {
    return null;
  }

  const icon = (
    <span
      className={cn(
        'relative flex items-center justify-center',
        ICON_WRAPPER_SIZE[size]
      )}
      aria-hidden="true"
    >
      <Icon
        name="sun"
        size={size}
        className={cn(
          'absolute inset-0 transition-all duration-300 motion-safe:duration-300',
          isDark ? 'opacity-0 scale-0 rotate-90' : 'opacity-100 scale-100 rotate-0'
        )}
      />
      <Icon
        name="moon"
        size={size}
        className={cn(
          'absolute inset-0 transition-all duration-300 motion-safe:duration-300',
          isDark ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-0 -rotate-90'
        )}
      />
    </span>
  );

  const toggle = () => {
    setTheme(nextTheme);
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size={size}
        className={cn('gap-2', className)}
        onClick={toggle}
        role="switch"
        aria-checked={isDark}
        aria-label={label}
      >
        {icon}
        {showLabel && (
          <span className="text-sm font-medium">
            {isDark ? 'Dark' : 'Light'}
          </span>
        )}
      </Button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors motion-safe:transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:bg-muted',
        ICON_BUTTON_SIZES[size],
        showLabel && 'w-auto gap-2 px-4',
        className
      )}
    >
      {icon}
      {showLabel && (
        <span className="ms-2 text-sm font-medium">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
