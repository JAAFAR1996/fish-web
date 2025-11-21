'use client';

import {
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { cn } from '@/lib/utils';

type GlassVariant =
  | 'light'
  | 'dark'
  | 'overlay'
  | 'ocean'
  | 'coral'
  | 'gold'
  | 'mocha';

type GlassIntensity = 'subtle' | 'medium' | 'strong';

export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: GlassVariant;
  intensity?: GlassIntensity;
  shimmer?: boolean;
  hoverable?: boolean;
}

type WithWillChange = CSSProperties & { willChange?: string };

function mergeWillChange(
  base: CSSProperties | undefined,
  shouldEnhance: boolean,
): CSSProperties | undefined {
  if (!shouldEnhance) {
    return base;
  }

  const additions = ['transform', 'backdrop-filter'];
  const existingValue = (base as WithWillChange | undefined)?.willChange ?? '';
  const existing = existingValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const merged = Array.from(new Set([...existing, ...additions])).join(', ');

  return {
    ...(base ?? {}),
    willChange: merged,
  };
}

export function GlassCard({
  variant = 'light',
  intensity = 'medium',
  shimmer = false,
  hoverable = false,
  children,
  className,
  onMouseEnter,
  onMouseLeave,
  style,
  ...rest
}: GlassCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [supportsBackdrop, setSupportsBackdrop] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof CSS === 'undefined' || !CSS.supports) {
      return;
    }

    const supportsStandard = CSS.supports('backdrop-filter', 'blur(2px)');
    const supportsWebkit = CSS.supports('-webkit-backdrop-filter', 'blur(2px)');

    if (supportsStandard || supportsWebkit) {
      setSupportsBackdrop(true);
    }
  }, []);

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable) {
        setIsHovering(true);
      }

      onMouseEnter?.(event);
    },
    [hoverable, onMouseEnter],
  );

  const handleMouseLeave = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (hoverable) {
        setIsHovering(false);
      }

      onMouseLeave?.(event);
    },
    [hoverable, onMouseLeave],
  );

  const computedStyle = useMemo(
    () => mergeWillChange(style, hoverable && isHovering),
    [hoverable, isHovering, style],
  );

  const variantClass = `glass-${variant}`;
  const intensityClass = intensity !== 'medium' ? `glass-${intensity}` : undefined;

  const hoverClasses = hoverable
    ? 'glass-hover glass-hover-scale motion-safe:hover:shadow-2xl transition-all duration-300'
    : undefined;

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        variantClass,
        intensityClass,
        hoverClasses,
        shimmer && 'glass-shimmer',
        !supportsBackdrop && 'backdrop-filter-unsupported',
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={computedStyle}
      {...rest}
    >
      {children}
    </div>
  );
}

export function GlassCardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 p-6', className)}
      {...props}
    />
  );
}

type HeadingTag = keyof Pick<
  JSX.IntrinsicElements,
  'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
>;

export interface GlassCardTitleProps
  extends HTMLAttributes<HTMLHeadingElement> {
  as?: HeadingTag;
}

export function GlassCardTitle({
  as: Component = 'h3',
  className,
  ...props
}: GlassCardTitleProps) {
  return (
    <Component
      className={cn(
        'text-2xl font-heading font-semibold leading-none tracking-tight',
        className,
      )}
      {...props}
    />
  );
}

export function GlassCardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

export function GlassCardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-4 p-6 pt-0', className)}
      {...props}
    />
  );
}

export function GlassCardFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between gap-2 p-6 pt-0', className)}
      {...props}
    />
  );
}
