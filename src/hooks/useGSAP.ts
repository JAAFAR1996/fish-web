import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP as useGSAPOriginal } from '@gsap/react';

import { FEATURES } from '@/lib/config/features';
import { prefersReducedMotion } from '@/lib/config/motion-tokens';
import {
  DURATION,
  EASING_CSS,
  EASING_GSAP,
  PRESETS,
  STAGGER,
} from '@/lib/config/motion-tokens';

type ContextSafeFunc = <T extends Function>(func: T) => T;
type ContextFunc = (context: gsap.Context, contextSafe?: ContextSafeFunc) => any;

interface UseGSAPConfig {
  scope?: RefObject<any> | Element | string | null;
  dependencies?: unknown[];
  revertOnUpdate?: boolean;
}

export interface EnhancedUseGSAPConfig extends UseGSAPConfig {
  respectFeatureFlags?: boolean;
  respectReducedMotion?: boolean;
}

export interface UseGSAPReturn {
  context: gsap.Context | null;
  contextSafe: ContextSafeFunc;
}

let pluginsRegistered = false;

const ensurePluginsRegistered = () => {
  if (pluginsRegistered || typeof window === 'undefined') {
    return;
  }

  gsap.registerPlugin(useGSAPOriginal, ScrollTrigger);
  pluginsRegistered = true;
};

const identityContextSafe: ContextSafeFunc = (func) => func;

export const useGSAP = (
  callback: ContextFunc,
  {
    scope,
    dependencies,
    revertOnUpdate,
    respectFeatureFlags = true,
    respectReducedMotion = true,
  }: EnhancedUseGSAPConfig = {},
): UseGSAPReturn => {
  const disableForFeatureFlags = respectFeatureFlags && !FEATURES.gsap;
  const disableForMotion = respectReducedMotion && prefersReducedMotion();
  const shouldDisable = disableForFeatureFlags || disableForMotion;

  if (!shouldDisable) {
    ensurePluginsRegistered();
  }

  const normalizedScope = scope === null ? undefined : scope;

  const { context, contextSafe } = useGSAPOriginal(
    shouldDisable ? () => {} : callback,
    {
      scope: normalizedScope,
      dependencies,
      revertOnUpdate,
    },
  );

  useEffect(() => {
    if (shouldDisable || typeof window === 'undefined') {
      return;
    }

    const refresh = () => {
      if (FEATURES.debugAnimations) {
        // eslint-disable-next-line no-console
        console.debug('[GSAP] ScrollTrigger refresh triggered');
      }

      ScrollTrigger.refresh();
    };

    const id = requestAnimationFrame(refresh);
    return () => cancelAnimationFrame(id);
  }, [shouldDisable]);

  if (!shouldDisable && FEATURES.debugAnimations) {
    // eslint-disable-next-line no-console
    console.debug('[GSAP] Context created', { scope, dependencies, revertOnUpdate });
  }

  return {
    context: shouldDisable ? null : context,
    contextSafe: contextSafe ?? identityContextSafe,
  };
};

export const createScrollTrigger = (options: ScrollTrigger.StaticVars) => {
  if (typeof window === 'undefined' || !FEATURES.gsap || prefersReducedMotion()) {
    return null;
  }

  ensurePluginsRegistered();
  return ScrollTrigger.create(options);
};

export const createTimeline = (options?: gsap.TimelineVars) => {
  if (typeof window === 'undefined' || !FEATURES.gsap || prefersReducedMotion()) {
    return null;
  }

  ensurePluginsRegistered();
  return gsap.timeline(options);
};

export const getMotionDuration = (durationMs: number) =>
  prefersReducedMotion() ? 0 : durationMs / 1000;

export { gsap, ScrollTrigger, DURATION, EASING_CSS, EASING_GSAP, PRESETS, STAGGER };
