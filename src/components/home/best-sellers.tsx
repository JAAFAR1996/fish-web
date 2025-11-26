'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ProductCard } from '@/components/products/product-card';
import { Carousel } from './carousel';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { useGSAP, gsap, PRESETS, STAGGER } from '@/hooks/useGSAP';
import { FEATURES } from '@/lib/config/features';

export interface BestSellersProps {
  products: Product[];
  onAddToCart: (product: Product) => Promise<void> | void;
  className?: string;
}

export function BestSellers({
  products,
  onAddToCart,
  className,
}: BestSellersProps) {
  const t = useTranslations('home.bestSellers');
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const hasProducts = products.length > 0;

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

    if (carouselRef.current) {
      gsap.from(carouselRef.current, {
        opacity: 0,
        y: 40,
        duration: PRESETS.productCard.duration / 1000,
        ease: PRESETS.productCard.gsapEase ?? 'power2.out',
        delay: STAGGER.tight / 1000,
        scrollTrigger: {
          trigger: carouselRef.current,
          start: 'top 85%',
          once: true,
        },
      });
    }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      aria-labelledby="best-sellers-heading"
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
            id="best-sellers-heading"
            className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t('title')}
          </h2>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            {t('subtitle')}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="self-start sm:self-auto">
          <Link href={{ pathname: '/products', query: { sort: 'bestSelling' } }}>
            {t('viewAll')}
            <Icon name="arrow-right" size="sm" className="ms-2" flipRtl />
          </Link>
        </Button>
      </div>

      {hasProducts ? (
        <div ref={carouselRef} data-gsap="carousel">
          <Carousel
            itemsPerView={{ base: 1, sm: 1, md: 2, lg: 4 }}
            gap={24}
            showNavigation
            showDots={false}
            ariaLabel={t('title')}
          >
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                priority={index === 0}
                tilt3D={index < 3}
                shineEffect={index === 0}
                glassHover={index < 2}
                className="snap-start"
              />
            ))}
          </Carousel>
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

export default BestSellers;
