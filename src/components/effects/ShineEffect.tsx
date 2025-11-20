'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';

import { EASING_CSS, prefersReducedMotion } from '@/lib/config/motion-tokens';
import { willChangeManager } from '@/lib/utils/performance';
import { cn } from '@/lib/utils';

import { useMousePosition } from '@/hooks/useMousePosition';

export interface ShineEffectProps {
  className?: string;
  color?: string;
  opacity?: number;
  size?: number;
  blur?: number;
  speed?: number;
}

type ShineCSSVars = React.CSSProperties & {
  '--shine-x'?: string;
  '--shine-y'?: string;
  '--shine-color'?: string;
};

const DEFAULT_SIZE = 600;
const DEFAULT_BLUR = 100;
const DEFAULT_SPEED = 0.2;
const DEFAULT_OPACITY = 0.3;

export const ShineEffect = ({
  className,
  color,
  opacity = DEFAULT_OPACITY,
  size = DEFAULT_SIZE,
  blur = DEFAULT_BLUR,
  speed = DEFAULT_SPEED,
}: ShineEffectProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const reducedMotion = prefersReducedMotion();
  const motionSpeedMs = Math.max(speed * 1000, 0);

  const { relativeX, relativeY, isInside } = useMousePosition({
    elementRef: overlayRef,
    throttleMs: 16,
    includeTouch: true,
    resetOnLeave: true,
  });

  useEffect(() => {
    const element = overlayRef.current;
    if (!element) {
      return;
    }

    if (isInside) {
      willChangeManager.add(element, ['transform', 'opacity']);
    } else {
      willChangeManager.auto(element, ['transform', 'opacity'], motionSpeedMs);
    }
  }, [isInside, motionSpeedMs]);

  const resolvedColor = useMemo(() => {
    if (color) {
      return color;
    }

    return resolvedTheme === 'dark' ? 'rgba(14, 143, 168, 1)' : 'rgba(255, 255, 255, 1)';
  }, [color, resolvedTheme]);

  const cssVars = useMemo<ShineCSSVars>(() => {
    const x = `${(relativeX * 100).toFixed(2)}%`;
    const y = `${(relativeY * 100).toFixed(2)}%`;
    return {
      '--shine-x': x,
      '--shine-y': y,
      '--shine-color': resolvedColor,
    };
  }, [relativeX, relativeY, resolvedColor]);

  if (reducedMotion) {
    return null;
  }

  return (
    <div
      ref={overlayRef}
      className={cn('shine-overlay pointer-events-none', className)}
      style={cssVars}
      aria-hidden="true"
    >
      <div
        className="shine-overlay__light"
        style={{
          width: size,
          height: size,
          opacity: isInside ? opacity : 0,
          filter: `blur(${blur}px)`,
          background: `radial-gradient(circle, ${resolvedColor} 0%, transparent 70%)`,
          transition: `transform ${speed}s ${EASING_CSS.smooth}, opacity ${speed}s ${EASING_CSS.smooth}`,
        }}
      />
    </div>
  );
};

export default ShineEffect;
