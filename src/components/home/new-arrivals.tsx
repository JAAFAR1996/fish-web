'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ProductCard } from '@/components/products/product-card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { useGSAP, gsap, PRESETS, STAGGER } from '@/hooks/useGSAP';
import { FEATURES } from '@/lib/config/features';

export interface NewArrivalsProps {
  products: Product[];
  onAddToCart: (product: Product) => Promise<void> | void;
  className?: string;
  maxProducts?: number;
}

export function NewArrivals({
  products,
  onAddToCart,
  className,
  maxProducts = 8,
}: NewArrivalsProps) {
  const t = useTranslations('home.newArrivals');
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const visibleProducts = products.slice(0, maxProducts);
  const hasProducts = visibleProducts.length > 0;

  useGSAP(() => {
    if (!FEATURES.gsap || !hasProducts) {
      return;
    }

    if (headingRef.current) {
      gsap.from(headingRef.current, {
        opacity: 0,
        y: 30,
        duration: PRESETS.heroTitle.duration / 1000,
        ease: PRESETS.heroTitle.gsapEase,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
        },
      });
    }

    if (gridRef.current) {
      gsap.from(gridRef.current, {
        opacity: 0,
        y: 40,
        duration: PRESETS.productCard.duration / 1000,
        ease: PRESETS.productCard.gsapEase ?? 'power2.out',
        scrollTrigger: {
          trigger: gridRef.current,
          start: 'top 85%',
          once: true,
        },
      });

      const cards = Array.from(gridRef.current.children);
      if (cards.length) {
        gsap.from(cards, {
          opacity: 0,
          y: 30,
          scale: 0.95,
          duration: PRESETS.productCard.duration / 1000,
          ease: PRESETS.productCard.gsapEase ?? 'power2.out',
          stagger: STAGGER.tight / 1000,
          scrollTrigger: {
            trigger: gridRef.current,
            start: 'top 85%',
            once: true,
          },
        });
      }
    }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="new-arrivals-heading"
      className={cn(
        'mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8',
        className
      )}
    >
      <div
        ref={headingRef}
        className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        data-gsap="heading"
      >
        <div>
          <h2
            id="new-arrivals-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t('title')}
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {t('subtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="self-start sm:self-auto">
          <Link href={{ pathname: '/products', query: { sort: 'newest' } }}>
            {t('viewAll')}
            <Icon name="arrow-right" size="sm" className="ms-2" flipRtl />
          </Link>
        </Button>
      </div>

      {hasProducts ? (
        <div
          ref={gridRef}
          className="@container grid grid-cols-2 gap-4 sm:gap-6 @md:grid-cols-3 @lg:grid-cols-4"
          data-gsap="grid"
        >
          {visibleProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              priority={index === 0}
              tilt3D={index < 4}
              shineEffect={index === 0}
              className="@container"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-muted-foreground/30 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
      )}
    </section>
  );
}

export default NewArrivals;
