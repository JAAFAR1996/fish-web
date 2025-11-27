'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

export function MinimalHero() {
  const tHome = useTranslations('home.hero');

  return (
    <section className="relative isolate flex min-h-[70vh] flex-col items-center justify-center gap-6 overflow-hidden bg-background text-center">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      <div className="absolute inset-0">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(0,217,255,0.08),transparent_35%),radial-gradient(circle_at_80%_50%,rgba(0,217,255,0.06),transparent_30%)]" />
      </div>
      <div className="relative flex flex-col items-center gap-4">
        <div className="h-[52vh] w-[70vw] max-w-6xl overflow-hidden rounded-3xl bg-muted">
          <video
            className="h-full w-full object-cover slow-zoom"
            src="/videos/aquarium-hero.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
        <h1 className="text-4xl font-bold md:text-5xl lg:text-6xl">{tHome('title')}</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">{tHome('subtitle')}</p>
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button size="lg">{tHome('ctaPrimary')}</Button>
          </Link>
          <Link href="/calculators">
            <Button size="lg" variant="ghost" className="water-ripple">
              {tHome('ctaSecondary')}
            </Button>
          </Link>
        </div>
      </div>
      <div className="absolute bottom-6 flex flex-col items-center text-muted-foreground">
        <span className="text-sm">Scroll</span>
        <span className="wave-scroll text-2xl leading-none">↓</span>
      </div>
    </section>
  );
}
