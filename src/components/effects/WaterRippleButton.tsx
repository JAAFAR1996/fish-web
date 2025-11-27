'use client';

import React, { forwardRef, useRef } from 'react';
import { gsap } from 'gsap';

import { Button, type ButtonProps } from '@/components/ui/button';
import { useGSAP } from '@/hooks/useGSAP';
import { FEATURES } from '@/lib/config/features';
import { cn } from '@/lib/utils';

type WaterRippleButtonProps = ButtonProps & {
  rippleColor?: string;
};

export const WaterRippleButton = forwardRef<HTMLButtonElement, WaterRippleButtonProps>(
  ({ className, rippleColor = 'rgba(0, 217, 255, 0.35)', children, ...props }, ref) => {
    const rippleRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLButtonElement>(null);
    const { contextSafe } = useGSAP(() => {}, { dependencies: [] });

    const handlePointer = contextSafe?.((event: React.PointerEvent<HTMLButtonElement>) => {
      if (!FEATURES.waterRipple || !rippleRef.current || !containerRef.current) {
        props.onPointerEnter?.(event);
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      gsap.killTweensOf(rippleRef.current);
      gsap.set(rippleRef.current, { left: x, top: y, scale: 0, opacity: 0.6 });
      gsap.to(rippleRef.current, {
        scale: 2.4,
        opacity: 0,
        duration: 0.8,
        ease: 'expo.out',
      });
      props.onPointerEnter?.(event);
    });

    return (
      <Button
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        className={cn('relative overflow-hidden water-ripple', className)}
        {...props}
        onPointerEnter={handlePointer}
      >
        <span
          ref={rippleRef}
          className="pointer-events-none absolute h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-md"
          style={{ background: rippleColor }}
          aria-hidden
        />
        <span className="relative z-10">{children}</span>
      </Button>
    );
  },
);

WaterRippleButton.displayName = 'WaterRippleButton';
