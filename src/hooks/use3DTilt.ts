'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

import { EASING_CSS, EASING_GSAP } from '@/lib/config/motion-tokens';
import { FEATURES, shouldUseAdvancedAnimations } from '@/lib/config/features';
import { willChangeManager } from '@/lib/utils/performance';

import { gsap } from './useGSAP';
import { useMousePosition } from './useMousePosition';

export interface Use3DTiltOptions {
  maxRotation?: number;
  perspective?: number;
  scale?: number;
  glare?: boolean;
  speed?: number;
  easing?: string;
  resetOnLeave?: boolean;
}

export interface Use3DTiltReturn {
  ref: React.RefObject<HTMLElement>;
  style: CSSProperties;
  isActive: boolean;
}

const DEFAULT_OPTIONS: Required<Pick<
  Use3DTiltOptions,
  'maxRotation' | 'perspective' | 'scale' | 'speed' | 'easing' | 'resetOnLeave'
>> = {
  maxRotation: 15,
  perspective: 1000,
  scale: 1.02,
  speed: 300,
  easing: EASING_GSAP.power2Out,
  resetOnLeave: true,
};

const toDegrees = (value: number): string => `${value.toFixed(2)}deg`;

export const use3DTilt = (options: Use3DTiltOptions = {}): Use3DTiltReturn => {
  const {
    maxRotation = DEFAULT_OPTIONS.maxRotation,
    perspective = DEFAULT_OPTIONS.perspective,
    scale = DEFAULT_OPTIONS.scale,
    speed = DEFAULT_OPTIONS.speed,
    easing = DEFAULT_OPTIONS.easing,
    resetOnLeave = DEFAULT_OPTIONS.resetOnLeave,
  } = options;

  const tiltRef = useRef<HTMLElement>(null);
  const [isActive, setIsActive] = useState(false);

  const shouldEnableGsap = FEATURES.gsap && shouldUseAdvancedAnimations();

  const { relativeX, relativeY, isInside } = useMousePosition({
    elementRef: tiltRef,
    throttleMs: 16,
    includeTouch: true,
    resetOnLeave,
  });

  const durationSeconds = Math.max(speed, 0) / 1000;
  const quickRotateXRef = useRef<((value: number) => void) | null>(null);
  const quickRotateYRef = useRef<((value: number) => void) | null>(null);
  const quickScaleRef = useRef<((value: number) => void) | null>(null);

  const resetTransform = useCallback(() => {
    if (!tiltRef.current || !shouldEnableGsap) {
      return;
    }

    quickRotateXRef.current?.(0);
    quickRotateYRef.current?.(0);
    quickScaleRef.current?.(1);
  }, [shouldEnableGsap]);

  useEffect(() => {
    const element = tiltRef.current;
    if (!element || !shouldEnableGsap) {
      return;
    }

    quickRotateXRef.current = gsap.quickTo(element, 'rotationX', {
      duration: durationSeconds,
      ease: easing,
    });
    quickRotateYRef.current = gsap.quickTo(element, 'rotationY', {
      duration: durationSeconds,
      ease: easing,
    });
    quickScaleRef.current = gsap.quickTo(element, 'scale', {
      duration: durationSeconds,
      ease: easing,
    });

    return () => {
      quickRotateXRef.current = null;
      quickRotateYRef.current = null;
      quickScaleRef.current = null;

      if (element) {
        gsap.set(element, { rotationX: 0, rotationY: 0, scale: 1 });
        willChangeManager.remove(element);
      }
    };
  }, [durationSeconds, easing, shouldEnableGsap]);

  useEffect(() => {
    const element = tiltRef.current;
    if (!element) {
      return;
    }

    if (isInside) {
      setIsActive((prev) => (prev ? prev : true));
      willChangeManager.add(element, ['transform']);
    } else {
      setIsActive((prev) => (prev ? false : prev));
      if (resetOnLeave) {
        resetTransform();
        willChangeManager.auto(element, ['transform'], speed);
      }
    }
  }, [isInside, resetOnLeave, resetTransform, speed]);

  useEffect(() => {
    if (!tiltRef.current || !shouldEnableGsap || !isInside) {
      return;
    }

    const rotateY = (relativeX - 0.5) * maxRotation * 2;
    const rotateX = (0.5 - relativeY) * maxRotation * 2;

    quickRotateXRef.current?.(rotateX);
    quickRotateYRef.current?.(rotateY);
    quickScaleRef.current?.(scale);
  }, [isInside, maxRotation, relativeX, relativeY, scale, shouldEnableGsap]);

  useEffect(() => {
    const element = tiltRef.current;
    return () => {
      if (element) {
        willChangeManager.remove(element);
      }
    };
  }, []);

  const style = useMemo<CSSProperties>(() => {
    if (shouldEnableGsap) {
      return {
        transformStyle: 'preserve-3d',
        perspective: `${perspective}px`,
      };
    }

    const rotateY = (relativeX - 0.5) * maxRotation * 2;
    const rotateX = (0.5 - relativeY) * maxRotation * 2;
    const scaleValue = isInside ? scale : 1;

    return {
      transformStyle: 'preserve-3d',
      perspective: `${perspective}px`,
      transition: `transform ${speed}ms ${EASING_CSS.smooth}`,
      transform: `rotateX(${toDegrees(rotateX)}) rotateY(${toDegrees(
        rotateY,
      )}) scale(${scaleValue.toFixed(3)})`,
    };
  }, [
    shouldEnableGsap,
    perspective,
    relativeX,
    relativeY,
    maxRotation,
    isInside,
    scale,
    speed,
  ]);

  return {
    ref: tiltRef,
    style,
    isActive,
  };
};
