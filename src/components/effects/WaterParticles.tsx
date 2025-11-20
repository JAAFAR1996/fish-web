'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import type { IOptions, RecursivePartial } from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';

import { prefersReducedMotion } from '@/lib/config/motion-tokens';
import { cn } from '@/lib/utils';

type DensityLevel = 'low' | 'medium' | 'high';
type ParticleColor = 'aqua' | 'ocean' | 'coral';

export interface WaterParticlesProps {
  className?: string;
  density?: DensityLevel;
  color?: ParticleColor;
  speed?: number;
  id?: string;
}

const densityMap: Record<DensityLevel, number> = {
  low: 30,
  medium: 55,
  high: 85,
};

const colorMap: Record<ParticleColor, string> = {
  aqua: '#0e8fa8',
  ocean: '#1da2d8',
  coral: '#ff6b6b',
};

const darkColorMap: Record<ParticleColor, string> = {
  aqua: '#7fdcf0',
  ocean: '#76b6c4',
  coral: '#ff9f9f',
};

export function WaterParticles({
  className,
  density = 'medium',
  color = 'aqua',
  speed = 1,
  id,
}: WaterParticlesProps) {
  const { resolvedTheme } = useTheme();
  const internalId = useId();
  const [disabledForMotion, setDisabledForMotion] = useState(() => prefersReducedMotion());
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setDisabledForMotion(prefersReducedMotion());
    handleChange();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    let mounted = true;

    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    })
      .then(() => {
        if (mounted) {
          setEngineReady(true);
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('[WaterParticles] Failed to initialize tsParticles', error);
        }
        if (mounted) {
          setEngineReady(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const options = useMemo<RecursivePartial<IOptions>>(() => {
    const isDark = resolvedTheme === 'dark';
    const baseColor = isDark ? darkColorMap[color] ?? darkColorMap.aqua : colorMap[color] ?? colorMap.aqua;
    const opacityMin = isDark ? 0.4 : 0.3;
    const opacityMax = isDark ? 0.85 : 0.6;

    return {
      detectRetina: true,
      fpsLimit: 30,
      background: {
        color: 'transparent',
      },
      pauseOnBlur: true,
      pauseOnOutsideViewport: true,
      particles: {
        number: {
          value: densityMap[density] ?? densityMap.medium,
          density: {
            enable: true,
            area: 800,
          },
        },
        color: {
          value: baseColor,
        },
        shape: {
          type: 'circle',
        },
        opacity: {
          value: { min: opacityMin, max: opacityMax },
          animation: {
            enable: true,
            speed: 0.5,
            minimumValue: opacityMin / 2,
          },
        },
        size: {
          value: { min: 2, max: 6 },
          animation: {
            enable: true,
            speed: 2,
            minimumValue: 1,
          },
        },
        move: {
          enable: !disabledForMotion,
          speed: speed * 1.5,
          direction: 'top',
          random: true,
          straight: false,
          outModes: {
            default: 'out',
            top: 'destroy',
            bottom: 'none',
          },
        },
      },
      interactivity: {
        detectsOn: 'canvas',
        events: {
          onHover: {
            enable: !disabledForMotion,
            mode: 'bubble',
          },
          resize: {
            enable: true,
          },
        },
        modes: {
          bubble: {
            distance: 100,
            size: 8,
            duration: 2,
            opacity: 0.8,
          },
        },
      },
    };
  }, [color, density, disabledForMotion, speed, resolvedTheme]);

  if (disabledForMotion || !engineReady) {
    return null;
  }

  return (
    <Particles
      id={id ?? `water-particles-${internalId}`}
      className={cn('particles-overlay', className)}
      options={options}
    />
  );
}
