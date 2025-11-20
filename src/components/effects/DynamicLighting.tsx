'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';

import { EASING_CSS, prefersReducedMotion } from '@/lib/config/motion-tokens';
import { willChangeManager } from '@/lib/utils/performance';
import { cn } from '@/lib/utils';

import { useMousePosition } from '@/hooks/useMousePosition';

export interface DynamicLightingProps {
  className?: string;
  color?: 'aqua' | 'ocean' | 'coral' | 'gold' | (string & {});
  intensity?: number;
  radius?: number;
  blur?: number;
  speed?: number;
  enableWaveEffect?: boolean;
}

type LightingCSSVars = React.CSSProperties & {
  '--light-x'?: string;
  '--light-y'?: string;
};

const COLOR_MAP: Record<'aqua' | 'ocean' | 'coral' | 'gold', string> = {
  aqua: 'rgb(14, 143, 168)',
  ocean: 'rgb(29, 162, 216)',
  coral: 'rgb(255, 107, 107)',
  gold: 'rgb(194, 150, 75)',
};

const DEFAULT_RADIUS = 800;
const DEFAULT_BLUR = 150;
const DEFAULT_INTENSITY = 0.3;
const DEFAULT_SPEED = 0.2;

export const DynamicLighting = ({
  className,
  color = 'aqua',
  intensity = DEFAULT_INTENSITY,
  radius = DEFAULT_RADIUS,
  blur = DEFAULT_BLUR,
  speed = DEFAULT_SPEED,
  enableWaveEffect = false,
}: DynamicLightingProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const reducedMotion = prefersReducedMotion();
  const { relativeX, relativeY, isInside } = useMousePosition({
    elementRef: containerRef,
    throttleMs: 16,
    includeTouch: false,
    resetOnLeave: false,
  });

  const lightRef = useRef<HTMLDivElement>(null);

  const baseColor = useMemo(() => {
    if (color && typeof color === 'string') {
      const key = color.toLowerCase() as keyof typeof COLOR_MAP;
      if (COLOR_MAP[key]) {
        return COLOR_MAP[key];
      }
    }

    return (
      color ?? (resolvedTheme === 'dark' ? COLOR_MAP.ocean : COLOR_MAP.aqua)
    );
  }, [color, resolvedTheme]);

  const cssVars = useMemo<LightingCSSVars>(() => {
    const clampedX = Number.isFinite(relativeX)
      ? Math.min(Math.max(relativeX, 0), 1)
      : 0.5;
    const clampedY = Number.isFinite(relativeY)
      ? Math.min(Math.max(relativeY, 0), 1)
      : 0.5;
    return {
      '--light-x': `${(clampedX * 100).toFixed(2)}%`,
      '--light-y': `${(clampedY * 100).toFixed(2)}%`,
    };
  }, [relativeX, relativeY]);

  useEffect(() => {
    const element = lightRef.current;
    if (!element) {
      return;
    }

    willChangeManager.add(element, ['transform', 'opacity']);

    return () => {
      willChangeManager.remove(element);
    };
  }, []);

  const activeOpacity = Math.max(
    0,
    Math.min(1, isInside ? intensity : intensity * 0.6),
  );

  if (reducedMotion) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={cn('dynamic-lighting-container pointer-events-none', className)}
      style={cssVars}
      aria-hidden="true"
    >
      <div
        ref={lightRef}
        className="dynamic-lighting-container__light"
        style={{
          width: radius,
          height: radius,
          opacity: activeOpacity,
          filter: `blur(${blur}px)`,
          background: `radial-gradient(circle, ${baseColor} 0%, transparent 60%)`,
          transition: `transform ${speed}s ${EASING_CSS.smooth}, opacity ${speed}s ${EASING_CSS.smooth}`,
          transform:
            'translate3d(calc(var(--light-x) - 50%), calc(var(--light-y) - 50%), 0)',
        }}
      />

      {enableWaveEffect && (
        <div
          className="dynamic-lighting-container__wave animate-wave-ripple"
          style={{
            width: radius,
            height: radius,
            opacity: activeOpacity * 0.7,
            filter: `blur(${blur}px)`,
            background: `radial-gradient(circle, ${baseColor} 0%, transparent 70%)`,
            transform:
              'translate3d(calc(var(--light-x) - 50%), calc(var(--light-y) - 50%), 0)',
          }}
        />
      )}
    </div>
  );
};

export default DynamicLighting;
