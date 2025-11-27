'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from '@/i18n/navigation';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types';

type LuxuryProductShowcaseProps = {
  product: Product;
  ctaHref?: string;
  subtitle?: string;
  previousHref?: string;
  nextHref?: string;
};

export function LuxuryProductShowcase({
  product,
  ctaHref,
  subtitle,
  previousHref,
  nextHref,
}: LuxuryProductShowcaseProps) {
  const t = useTranslations('product.actions');
  const price = useMemo(() => formatCurrency(product.price, 'en'), [product.price]);

  return (
    <Card className="group relative overflow-hidden border bg-background/80 p-8 lg:p-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.14),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(0,217,255,0.08),transparent_28%)]" />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {subtitle ?? 'Limited Edition'}
          </p>
          <h2 className="text-4xl font-bold leading-tight lg:text-5xl">{product.name}</h2>
          <p className="max-w-xl text-lg text-muted-foreground">{product.description}</p>
          <div className="flex items-center gap-6">
            <span className="text-3xl font-semibold">{price}</span>
            <div className="h-px flex-1 bg-gradient-to-r from-foreground/30 via-foreground/10 to-transparent" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={ctaHref ?? `/products/${product.slug}`}>
              <Button className="luxury-fade slow-zoom" size="lg">
                {t('viewDetails')}
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost" size="lg" className="underline-offset-4 hover:underline">
                {t('quickView')}
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative min-h-[320px] overflow-hidden rounded-3xl bg-muted">
          <Image
            src={product.images?.[0] || product.thumbnail}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-[600ms] ease-in-out group-hover:scale-110"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-background/60 via-transparent to-background/40" />
        </div>
      </div>

      {(previousHref || nextHref) && (
        <div className="pointer-events-auto absolute inset-y-0 left-0 right-0 flex items-center justify-between px-3">
          {previousHref ? (
            <Link
              href={previousHref}
              className="group/button inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-background/70 text-foreground shadow-lg backdrop-blur transition hover:-translate-x-0.5 hover:border-foreground/40"
              aria-label="Previous product"
            >
              <span className="text-lg transition duration-700 ease-in-out group-hover/button:-translate-x-0.5">
                ←
              </span>
            </Link>
          ) : (
            <span />
          )}
          {nextHref ? (
            <Link
              href={nextHref}
              className="group/button inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-background/70 text-foreground shadow-lg backdrop-blur transition hover:translate-x-0.5 hover:border-foreground/40"
              aria-label="Next product"
            >
              <span className="text-lg transition duration-700 ease-in-out group-hover/button:translate-x-0.5">
                →
              </span>
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </Card>
  );
}
