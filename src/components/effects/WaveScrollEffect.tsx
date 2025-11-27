'use client';

import { useEffect, useRef } from 'react';

import { FEATURES } from '@/lib/config/features';
import { useGSAP, gsap, ScrollTrigger } from '@/hooks/useGSAP';
import { prefersReducedMotion } from '@/lib/config/motion-tokens';

type WaveScrollEffectProps = {
  selector?: string;
  stagger?: number;
};

export function WaveScrollEffect({ selector = '[data-wave-section]', stagger = 0.12 }: WaveScrollEffectProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const reduceMotion = prefersReducedMotion();

  useGSAP(
    (context) => {
      if (!FEATURES.gsap || reduceMotion) return;
      const sections = gsap.utils.toArray<HTMLElement>(selector);
      sections.forEach((section, idx) => {
        context.add(() => {
          gsap.fromTo(
            section,
            { y: 40, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'sine.out',
              delay: idx * stagger,
              scrollTrigger: {
                trigger: section,
                start: 'top 80%',
              },
            },
          );
        });
      });
    },
    { scope: scopeRef },
  );

  useEffect(() => {
    if (FEATURES.gsap) {
      ScrollTrigger.refresh();
    }
  }, []);

  return <div ref={scopeRef} aria-hidden />;
}
