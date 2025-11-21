'use client';

import dynamic from 'next/dynamic';
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useTranslations } from 'next-intl';

import { Badge, Button, Icon } from '@/components/ui';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  shouldUse3D,
  shouldUseParticles,
  logFeatureStatus,
  FEATURES,
} from '@/lib/config/features';
import { AquariumLoader } from '@/components/3d/AquariumLoader';
import { useGSAP, gsap, ScrollTrigger, PRESETS, STAGGER } from '@/hooks/useGSAP';
import { prefersReducedMotion } from '@/lib/config/motion-tokens';
import { DynamicLighting } from '@/components/effects';
import { willChangeManager } from '@/lib/utils/performance';

const AquariumScene = dynamic(
  () => import('@/components/3d').then((mod) => mod.AquariumScene),
  { ssr: false, suspense: true },
);

const WaterParticles = dynamic(
  () => import('@/components/effects').then((mod) => mod.WaterParticles),
  { ssr: false, suspense: true },
);

export function Hero() {
  const t = useTranslations('home.hero');
  const [isInView, setIsInView] = useState(false);
  const [parallaxOffset, setParallaxOffset] = useState(0);
  const [show3D, setShow3D] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [enableLighting, setEnableLighting] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

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
    if (FEATURES.gsap) {
      setParallaxOffset(0);
      return;
    }

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
    setShow3D(shouldUse3D());
    setShowParticles(shouldUseParticles());
    setEnableLighting(FEATURES.gsap && !prefersReducedMotion());
    logFeatureStatus();
  }, []);

  useGSAP(
    (ctx) => {
      if (!FEATURES.gsap) {
        return;
      }

      const timeline = gsap.timeline({
        defaults: {
          ease: PRESETS.heroTitle.gsapEase,
          duration: PRESETS.heroTitle.duration / 1000,
        },
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top 85%',
          once: true,
        },
      });

      if (badgeRef.current) {
        timeline.from(
          badgeRef.current,
          {
            opacity: 0,
            y: 20,
            duration: PRESETS.heroSubtitle.duration / 1000,
          },
          0,
        );
      }

      if (titleRef.current) {
        timeline.from(
          titleRef.current,
          {
            opacity: 0,
            y: 30,
            scale: 0.95,
          },
          STAGGER.loose / 1000,
        );
      }

      if (subtitleRef.current) {
        timeline.from(
          subtitleRef.current,
          {
            opacity: 0,
            y: 20,
          },
          STAGGER.relaxed / 1000,
        );
      }

      if (ctaRef.current) {
        timeline.from(
          Array.from(ctaRef.current.children),
          {
            opacity: 0,
            y: 20,
            scale: 0.95,
            ease: PRESETS.heroCTA.gsapEase,
            stagger: STAGGER.tight / 1000,
          },
          STAGGER.loose / 1000,
        );
      }

      const visualEl = visualRef.current;
      if (visualEl) {
        ctx.add(() => {
          const trigger = ScrollTrigger.create({
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            onEnter: () => willChangeManager.add(visualEl, ['transform']),
            onLeave: () => willChangeManager.auto(visualEl, ['transform'], 300),
            onLeaveBack: () => willChangeManager.auto(visualEl, ['transform'], 300),
            onUpdate: (self) => {
              const offset = self.progress * 100;
              gsap.to(visualEl, {
                '--parallax-y': `${offset}px`,
                duration: 0.3,
                ease: 'power1.out',
              });
            },
          });

          return () => {
            trigger.kill();
            willChangeManager.remove(visualEl);
            gsap.set(visualEl, { '--parallax-y': '0px' });
          };
        });
      }
    },
    { scope: heroRef },
  );

  useEffect(() => {
    if (FEATURES.gsap) {
      return;
    }

    if (!isInView) {
      setParallaxOffset(0);
    }
  }, [isInView]);

  const parallaxStyle = {
    '--parallax-y': `${parallaxOffset}px`,
  } as CSSProperties;

  const shouldRender3D = show3D && isInView;
  const shouldRenderParticles = showParticles && isInView;

  return (
    <section
      ref={heroRef}
      aria-label="Hero section"
      className="relative min-h-[600px] lg:min-h-[700px] overflow-hidden bg-gradient-to-br from-aqua-50 to-sand-50 dark:from-aqua-950 dark:to-sand-950"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content Column */}
          <div ref={contentRef} className="space-y-6 max-w-xl" data-gsap="content">
            {/* USP Badge */}
            <div ref={badgeRef} className="hero-animate-1" data-gsap="badge">
              <Badge
                variant="outline"
                className="text-aqua-600 dark:text-aqua-400 border-aqua-600 dark:border-aqua-400 uppercase text-xs font-semibold"
              >
                {t('usp')}
              </Badge>
            </div>

            {/* Main Heading */}
            <div className="hero-animate-2" data-gsap="title">
              <h1
                ref={titleRef}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-balance"
              >
                {t('title')}
              </h1>
            </div>

            {/* Subtitle */}
            <div className="hero-animate-3" data-gsap="subtitle">
              <p ref={subtitleRef} className="text-lg sm:text-xl text-muted-foreground max-w-prose">
                {t('subtitle')}
              </p>
            </div>

            {/* CTAs */}
            <div ref={ctaRef} className="hero-animate-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6" data-gsap="cta">
              <Button variant="primary" size="lg" asChild>
                <Link href="/products">
                  {t('ctaPrimary')}
                  <Icon name="arrow-right" size="sm" className="ms-2" flipRtl />
                </Link>
              </Button>
              <Link
                href="/calculators"
                className="text-base font-medium text-aqua-700 underline-offset-4 hover:underline dark:text-aqua-300"
              >
                {t('ctaSecondary')}
              </Link>
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
            ref={visualRef}
            className={cn(
              'hero-tilt dynamic-lighting-container relative aspect-square rounded-2xl overflow-hidden',
              'bg-gradient-to-br from-aqua-400/20 to-sand-400/20',
              'dark:from-aqua-600/20 dark:to-sand-600/20',
              'shadow-2xl'
            )}
            style={parallaxStyle}
            data-3d-active={shouldRender3D ? 'true' : 'false'}
            data-lighting-active={enableLighting ? 'true' : 'false'}
          >
            {/* 3D Model Slot */}
            <div
              className="hero-3d-slot relative flex h-full w-full items-center justify-center"
              data-3d-active={shouldRender3D ? 'true' : 'false'}
            >
              {shouldRender3D ? (
                <Suspense fallback={<AquariumLoader />}>
                  <AquariumScene
                    fishCount={5}
                    autoRotate
                    enableOrbitControls={false}
                    enableShadows={false}
                    className="h-full w-full"
                  />
                </Suspense>
              ) : (
                <div className="aquarium-fallback flex h-full w-full items-center justify-center rounded-2xl">
                  <div className="text-center p-8">
                    <div className="mb-4 inline-block rounded-full bg-aqua-500/10 p-6 dark:bg-aqua-400/10">
                      <Icon
                        name="package"
                        size="lg"
                        className="text-aqua-600 dark:text-aqua-400"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('modelPlaceholder')}</p>
                  </div>
                </div>
              )}

              {shouldRenderParticles && (
                <Suspense fallback={null}>
                  <WaterParticles density="medium" color="aqua" speed={1} className="particles-overlay" />
                </Suspense>
              )}
            </div>
            {enableLighting && (
              <DynamicLighting
                color="aqua"
                intensity={0.3}
                radius={800}
                blur={150}
                speed={0.2}
                enableWaveEffect
                className="absolute inset-0"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
