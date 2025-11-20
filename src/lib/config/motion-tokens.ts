// Centralized motion tokens for consistent animations across the app.

export const DURATION = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 700,
  slowest: 1000,
} as const;

export type Duration = (typeof DURATION)[keyof typeof DURATION];

export const EASING_CSS = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  snappy: 'cubic-bezier(0.4, 0, 0.6, 1)',
  gentle: 'cubic-bezier(0.2, 0, 0, 1)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  elastic: 'cubic-bezier(0.2, 0.6, 0.2, 1.2)',
  anticipate: 'cubic-bezier(0.36, 0, 0.66, -0.56)',
} as const;

export type CssEasing = (typeof EASING_CSS)[keyof typeof EASING_CSS];

export const EASING_GSAP = {
  power1Out: 'power1.out',
  power2Out: 'power2.out',
  power3Out: 'power3.out',
  power4Out: 'power4.out',
} as const;

export type GsapEasing = (typeof EASING_GSAP)[keyof typeof EASING_GSAP];

export const SCALE = {
  none: 1,
  subtle: 1.02,
  small: 1.05,
  medium: 1.1,
  large: 1.15,
  xlarge: 1.2,
} as const;

export type Scale = (typeof SCALE)[keyof typeof SCALE];

export const STAGGER = {
  none: 0,
  tight: 50,
  normal: 100,
  relaxed: 150,
  loose: 200,
} as const;

export type Stagger = (typeof STAGGER)[keyof typeof STAGGER];

// Spring-like configs tuned for React Spring / Framer defaults.
export const SPRING_CONFIG = {
  gentle: { tension: 120, friction: 18 },
  snappy: { tension: 220, friction: 20 },
  bouncy: { tension: 260, friction: 16 },
  wobbly: { tension: 180, friction: 10 },
} as const;

export type SpringConfig = (typeof SPRING_CONFIG)[keyof typeof SPRING_CONFIG];

export type MotionPreset = {
  duration: Duration;
  cssEasing: CssEasing;
  scale?: Scale;
  stagger?: Stagger;
  springConfig?: SpringConfig;
  gsapEase?: GsapEasing;
};

export const PRESETS = {
  hover: {
    duration: DURATION.fast,
    cssEasing: EASING_CSS.smooth,
    scale: SCALE.small,
  },
  modal: {
    duration: DURATION.slow,
    cssEasing: EASING_CSS.easeInOut,
    springConfig: SPRING_CONFIG.gentle,
    gsapEase: EASING_GSAP.power1Out,
  },
  dropdown: {
    duration: DURATION.normal,
    cssEasing: EASING_CSS.snappy,
    scale: SCALE.subtle,
  },
  heroTitle: {
    duration: DURATION.slow,
    cssEasing: EASING_CSS.smooth,
    stagger: STAGGER.loose,
    gsapEase: EASING_GSAP.power2Out,
  },
  heroSubtitle: {
    duration: DURATION.normal,
    cssEasing: EASING_CSS.gentle,
    stagger: STAGGER.relaxed,
    gsapEase: EASING_GSAP.power1Out,
  },
  heroCTA: {
    duration: DURATION.slow,
    cssEasing: EASING_CSS.bounce,
    scale: SCALE.medium,
    gsapEase: EASING_GSAP.power3Out,
  },
  productCard: {
    duration: DURATION.fast,
    cssEasing: EASING_CSS.smooth,
    scale: SCALE.small,
    gsapEase: EASING_GSAP.power2Out,
  },
  addToCart: {
    duration: DURATION.normal,
    cssEasing: EASING_CSS.elastic,
    springConfig: SPRING_CONFIG.bouncy,
    gsapEase: EASING_GSAP.power4Out,
  },
} as const satisfies Record<string, MotionPreset>;

export type Preset = (typeof PRESETS)[keyof typeof PRESETS];

export const msToSeconds = (ms: number): string => {
  const seconds = ms / 1000;
  return `${Number(seconds.toFixed(3))}s`;
};

export const createTransition = (
  properties: string[],
  duration: Duration = DURATION.normal,
  easing: CssEasing = EASING_CSS.smooth,
): string =>
  properties
    .map((property) => `${property} ${msToSeconds(duration)} ${easing}`)
    .join(', ');

export const generateStaggerDelays = (
  count: number,
  stagger: number = STAGGER.normal,
): number[] =>
  Array.from({ length: Math.max(0, count) }, (_, index) => index * stagger);

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
