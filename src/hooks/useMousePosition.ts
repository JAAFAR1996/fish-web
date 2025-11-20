'use client';

import { RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { prefersReducedMotion } from '@/lib/config/motion-tokens';
import { rafThrottle } from '@/lib/utils/performance';

export interface UseMousePositionOptions {
  throttleMs?: number;
  includeTouch?: boolean;
  resetOnLeave?: boolean;
  elementRef?: RefObject<HTMLElement>;
}

export interface UseMousePositionReturn {
  x: number;
  y: number;
  relativeX: number;
  relativeY: number;
  isInside: boolean;
}

const DEFAULT_STATE: UseMousePositionReturn = {
  x: 0,
  y: 0,
  relativeX: 0.5,
  relativeY: 0.5,
  isInside: false,
};

const clamp01 = (value: number): number => Math.min(Math.max(value, 0), 1);

const isEqualState = (
  current: UseMousePositionReturn,
  next: UseMousePositionReturn,
): boolean =>
  current.x === next.x &&
  current.y === next.y &&
  current.relativeX === next.relativeX &&
  current.relativeY === next.relativeY &&
  current.isInside === next.isInside;

export const useMousePosition = (
  options: UseMousePositionOptions = {},
): UseMousePositionReturn => {
  const {
    throttleMs = 16,
    includeTouch = false,
    resetOnLeave = true,
    elementRef,
  } = options;
  const [state, setState] = useState<UseMousePositionReturn>(DEFAULT_STATE);
  const reduceMotionRef = useRef(false);
  const lastUpdateRef = useRef(0);
  const element = elementRef?.current ?? null;

  const resetState = useMemo(
    () => ({
      ...DEFAULT_STATE,
    }),
    [],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    reduceMotionRef.current = prefersReducedMotion();

    if (reduceMotionRef.current) {
      setState((prev) => (isEqualState(prev, DEFAULT_STATE) ? prev : DEFAULT_STATE));
      return;
    }

    const target: HTMLElement | Window = element ?? window;

    const updateFromPoint = (clientX: number, clientY: number) => {
      const baseState = element
        ? (() => {
            const rect = element.getBoundingClientRect();
            const width = rect.width || 1;
            const height = rect.height || 1;
            const relativeX = clamp01((clientX - rect.left) / width);
            const relativeY = clamp01((clientY - rect.top) / height);
            const isInside =
              clientX >= rect.left &&
              clientX <= rect.right &&
              clientY >= rect.top &&
              clientY <= rect.bottom;

            return { relativeX, relativeY, isInside };
          })()
        : (() => {
            const width = window.innerWidth || 1;
            const height = window.innerHeight || 1;
            const relativeX = clamp01(clientX / width);
            const relativeY = clamp01(clientY / height);
            const isInside =
              clientX >= 0 && clientX <= width && clientY >= 0 && clientY <= height;

            return { relativeX, relativeY, isInside };
          })();

      const nextState: UseMousePositionReturn = {
        x: clientX,
        y: clientY,
        relativeX: baseState.relativeX,
        relativeY: baseState.relativeY,
        isInside: baseState.isInside,
      };

      setState((prev) => (isEqualState(prev, nextState) ? prev : nextState));
    };

    const updatePosition = rafThrottle((event: MouseEvent | TouchEvent) => {
      if (throttleMs > 0) {
        const currentTime = performance.now();
        if (currentTime - lastUpdateRef.current < throttleMs) {
          return;
        }
        lastUpdateRef.current = currentTime;
      }

      if ('touches' in event) {
        const touch = event.touches[0];
        if (!touch) {
          return;
        }
        updateFromPoint(touch.clientX, touch.clientY);
      } else {
        updateFromPoint(event.clientX, event.clientY);
      }
    });

    const handleMouseMove = (event: MouseEvent) => {
      updatePosition(event);
    };

    const handleTouchMove = (event: TouchEvent) => {
      updatePosition(event);
    };

    const handleLeave = () => {
      if (!resetOnLeave) {
        return;
      }
      setState((prev) => (isEqualState(prev, resetState) ? prev : resetState));
    };

    const listenerOptions: AddEventListenerOptions = { passive: true };

    target.addEventListener('mousemove', handleMouseMove, listenerOptions);

    if (includeTouch) {
      target.addEventListener('touchmove', handleTouchMove, listenerOptions);
    }

    if (resetOnLeave && element) {
      element.addEventListener('mouseleave', handleLeave, listenerOptions);
      element.addEventListener('touchend', handleLeave, listenerOptions);
      element.addEventListener('touchcancel', handleLeave, listenerOptions);
    } else if (resetOnLeave && !element) {
      window.addEventListener('mouseleave', handleLeave, listenerOptions);
    }

    return () => {
      updatePosition.cancel();
      target.removeEventListener('mousemove', handleMouseMove, listenerOptions);

      if (includeTouch) {
        target.removeEventListener('touchmove', handleTouchMove, listenerOptions);
      }

      if (resetOnLeave && element) {
        element.removeEventListener('mouseleave', handleLeave, listenerOptions);
        element.removeEventListener('touchend', handleLeave, listenerOptions);
        element.removeEventListener('touchcancel', handleLeave, listenerOptions);
      } else if (resetOnLeave && !element) {
        window.removeEventListener('mouseleave', handleLeave, listenerOptions);
      }
    };
  }, [element, includeTouch, resetOnLeave, throttleMs, resetState]);

  return state;
};

