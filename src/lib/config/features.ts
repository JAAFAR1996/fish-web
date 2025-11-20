'use client';

import { prefersReducedMotion } from './motion-tokens';

type PerformanceMode = 'auto' | 'true' | 'false';

interface FeatureFlags {
  gsap: boolean;
  threejs: boolean;
  lottie: boolean;
  particles: boolean;
  performanceMode: PerformanceMode;
  debugAnimations: boolean;
}

interface DeviceCapabilities {
  hardwareConcurrency: number | null;
  deviceMemory: number | null;
  effectiveType: string | null;
  prefersReducedMotion: boolean;
  webglSupported: boolean;
}

const envCache = new Map<string, string | undefined>();

const getEnv = (key: string): string | undefined => {
  if (envCache.has(key)) {
    return envCache.get(key);
  }

  const value = typeof process !== 'undefined' ? process.env[key] : undefined;
  envCache.set(key, value);
  return value;
};

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value == null) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }
  return defaultValue;
};

const getFeatureFlag = (key: string, defaultValue: boolean): boolean =>
  parseBoolean(getEnv(key), defaultValue);

const getPerformanceMode = (): PerformanceMode => {
  const value = getEnv('NEXT_PUBLIC_PERFORMANCE_MODE')?.trim().toLowerCase();
  if (value === 'true' || value === 'false' || value === 'auto') {
    return value;
  }
  return 'auto';
};

export const FEATURES: FeatureFlags = {
  gsap: getFeatureFlag('NEXT_PUBLIC_ENABLE_GSAP', true),
  threejs: getFeatureFlag('NEXT_PUBLIC_ENABLE_3D', true),
  lottie: getFeatureFlag('NEXT_PUBLIC_ENABLE_LOTTIE', true),
  particles: getFeatureFlag('NEXT_PUBLIC_ENABLE_PARTICLES', true),
  performanceMode: getPerformanceMode(),
  debugAnimations: getFeatureFlag('NEXT_PUBLIC_DEBUG_ANIMATIONS', false),
};

let cachedWebGLSupport: boolean | null = null;

export const supportsWebGL = (): boolean => {
  if (cachedWebGLSupport !== null) {
    return cachedWebGLSupport;
  }

  if (typeof window === 'undefined') {
    cachedWebGLSupport = false;
    return cachedWebGLSupport;
  }

  try {
    const canvas = document.createElement('canvas');
    const webglContext = canvas.getContext('webgl') as WebGLRenderingContext | null;
    const experimentalContext = canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    const webgl2Context = canvas.getContext('webgl2') as WebGL2RenderingContext | null;
    const contexts: Array<WebGLRenderingContext | WebGL2RenderingContext | null> = [
      webglContext,
      experimentalContext,
      webgl2Context,
    ];

    cachedWebGLSupport = contexts.some((context) => context != null);
    return cachedWebGLSupport;
  } catch (error) {
    cachedWebGLSupport = false;
    return cachedWebGLSupport;
  }
};

let cachedDeviceStatus: boolean | null = null;

export const isLowEndDevice = (): boolean => {
  if (cachedDeviceStatus !== null) {
    return cachedDeviceStatus;
  }

  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    cachedDeviceStatus = false;
    return cachedDeviceStatus;
  }

  try {
    const cores =
      typeof navigator.hardwareConcurrency === 'number' ? navigator.hardwareConcurrency : null;
    const memory =
      typeof (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 'number'
        ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
        : null;
    const connection =
      typeof (navigator as Navigator & { connection?: { effectiveType?: string } }).connection ===
      'object'
        ? (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
            ?.effectiveType ?? null
        : null;

    const lowCores = cores != null && cores > 0 && cores < 4;
    const lowMemory = memory != null && memory > 0 && memory < 4;
    const slowConnection = connection != null && ['slow-2g', '2g', '3g'].includes(connection);
    const reducedMotion = prefersReducedMotion();

    cachedDeviceStatus = lowCores || lowMemory || slowConnection || reducedMotion;
    return cachedDeviceStatus;
  } catch (error) {
    cachedDeviceStatus = false;
    return cachedDeviceStatus;
  }
};

export const shouldUseAdvancedAnimations = (): boolean => {
  if (FEATURES.performanceMode === 'true') {
    return false;
  }

  if (FEATURES.performanceMode === 'false') {
    return true;
  }

  // Auto mode
  if (typeof window === 'undefined') {
    return false;
  }

  return !isLowEndDevice();
};

export const shouldUse3D = (): boolean => {
  if (!FEATURES.threejs) {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return shouldUseAdvancedAnimations() && supportsWebGL();
};

export const shouldUseParticles = (): boolean => {
  if (!FEATURES.particles) {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return shouldUseAdvancedAnimations();
};

const collectDeviceCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      hardwareConcurrency: null,
      deviceMemory: null,
      effectiveType: null,
      prefersReducedMotion: false,
      webglSupported: false,
    };
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string };
  };

  return {
    hardwareConcurrency:
      typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null,
    deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    effectiveType: nav.connection?.effectiveType ?? null,
    prefersReducedMotion: prefersReducedMotion(),
    webglSupported: supportsWebGL(),
  };
};

export const logFeatureStatus = (): void => {
  if (!FEATURES.debugAnimations || typeof window === 'undefined') {
    return;
  }

  const device = collectDeviceCapabilities();

  // eslint-disable-next-line no-console
  console.groupCollapsed('[Features] Animation & 3D status');
  // eslint-disable-next-line no-console
  console.table({
    gsap: FEATURES.gsap,
    threejs: FEATURES.threejs,
    lottie: FEATURES.lottie,
    particles: FEATURES.particles,
    performanceMode: FEATURES.performanceMode,
    debugAnimations: FEATURES.debugAnimations,
    shouldUseAdvancedAnimations: shouldUseAdvancedAnimations(),
    shouldUse3D: shouldUse3D(),
    shouldUseParticles: shouldUseParticles(),
  });

  // eslint-disable-next-line no-console
  console.table(device);
  // eslint-disable-next-line no-console
  console.groupEnd();
};
