'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export function Hero() {
  const t = useTranslations('home.hero');
  const [isInView, setIsInView] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const node = heroRef.current;
    if (node) {
      observer.observe(node);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !isInView) {
      setParallaxOffset(0);
      return;
    }

    const updateParallax = () => {
      const heroElement = heroRef.current;
      if (!heroElement) return;

      const rect = heroElement.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const heroCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const distanceFromCenter = heroCenter - viewportCenter;
      const normalized = distanceFromCenter / viewportHeight;
      const offset = Math.max(-50, Math.min(50, -normalized * 120));
      setParallaxOffset(offset);
    };

    updateParallax();

    let rafId: number | null = null;
    const handleScroll = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [isInView]);

  useEffect(() => {
    if (!isInView) {
      setParallaxOffset(0);
    }
  }, [isInView]);

  const parallaxStyle = {
    '--parallax-y': `${parallaxOffset}px`,
  } as CSSProperties;

  return (
    <section
      ref={heroRef}
      aria-label="Hero section"
      className="relative min-h-[600px] lg:min-h-[700px] overflow-hidden bg-gradient-to-br from-aqua-50 to-sand-50 dark:from-aqua-950 dark:to-sand-950"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content Column */}
          <div className="space-y-6 max-w-xl">
            {/* USP Badge */}
            <div className="hero-animate-1">
              <Badge
                variant="outline"
                className="text-aqua-600 dark:text-aqua-400 border-aqua-600 dark:border-aqua-400 uppercase text-xs font-semibold"
              >
                {t('usp')}
              </Badge>
            </div>

            {/* Main Heading */}
            <div className="hero-animate-2">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance">
                {t('title')}
              </h1>
            </div>

            {/* Subtitle */}
            <div className="hero-animate-3">
              <p className="text-lg sm:text-xl text-muted-foreground max-w-prose">
                {t('subtitle')}
              </p>
            </div>

            {/* CTAs */}
            <div className="hero-animate-4 flex flex-col sm:flex-row gap-4">
              <Button variant="primary" size="lg" asChild>
                <Link href="/products">
                  {t('ctaPrimary')}
                  <Icon name="arrow-right" size="sm" className="ms-2" flipRtl />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/calculators">
                  {t('ctaSecondary')}
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Icon name="truck" size="sm" className="text-aqua-500" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  {t('trustIndicators.freeShipping')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="help" size="sm" className="text-aqua-500" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  {t('trustIndicators.expertSupport')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Icon name="credit-card" size="sm" className="text-aqua-500" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  {t('trustIndicators.securePayment')}
                </span>
              </div>
            </div>
          </div>

          {/* Visual Column - 3D Slot */}
          <div
            className={cn(
              'hero-tilt relative aspect-square rounded-2xl overflow-hidden',
              'bg-gradient-to-br from-aqua-400/20 to-sand-400/20',
              'dark:from-aqua-600/20 dark:to-sand-600/20',
              'shadow-2xl'
            )}
            style={parallaxStyle}
          >
            {/* 3D Model Slot */}
            <div
              className="hero-3d-slot w-full h-full flex items-center justify-center"
              data-3d-ready="true"
            >
              {/* TODO: Integrate Three.js or React Three Fiber here */}
              {/* Slot ready for GLB model loading */}
              {/* 
              <Canvas>
                <Suspense fallback={<Loader />}>
                  <Model url="/models/aquarium.glb" />
                </Suspense>
              </Canvas> 
              */}
              
              {/* Placeholder Content */}
              <div className="text-center p-8">
                <div className="inline-block p-6 rounded-full bg-aqua-500/10 dark:bg-aqua-400/10 mb-4">
                  <Icon 
                    name="package" 
                    size="lg" 
                    className="text-aqua-600 dark:text-aqua-400" 
                    aria-hidden="true"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('modelPlaceholder')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
