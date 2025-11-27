import { setRequestLocale } from 'next-intl/server';
import {
  BestSellers,
  CalculatorsShowcase,
  FeaturedCategories,
  NewArrivals,
  TrustBadges,
} from '@/components/home';
import { MasonryGalleryGrid } from '@/components/gallery';
import dynamic from 'next/dynamic';
import { RecommendedRail } from '@/components/products';
import { MinimalHero } from '@/components/home/MinimalHero';
import { ProductOfTheWeek } from '@/components/home/ProductOfTheWeek';
import { LuxuryProductShowcase } from '@/components/products/LuxuryProductShowcase';
import { EnhancedAquariumScene } from '@/components/3d/EnhancedAquariumScene';
import { WaveScrollEffect } from '@/components/effects/WaveScrollEffect';
import { getBestSellers, getNewArrivals, getRecommendedProducts } from '@/lib/data/products';
import { getGallerySetups } from '@/lib/gallery/gallery-queries';
import { FEATURES } from '@/lib/config/features';
import type { Product, Locale } from '@/types';

type HomePageProps = {
  params: { locale: string };
};

const DynamicInstagram = dynamic(
  () => import('@/components/home/instagram-feed').then((mod) => mod.InstagramFeed),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-xl bg-muted/50" /> }
);

const DynamicQuickGuides = dynamic(
  () => import('@/components/home/quick-guides').then((mod) => mod.QuickGuides),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-xl bg-muted/50" /> }
);

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = params;
  setRequestLocale(locale);

  const [bestSellers, newArrivals, recommended] = await Promise.all([
    getBestSellers(8),
    getNewArrivals(8),
    getRecommendedProducts(8),
  ]);
  const gallerySetups = await getGallerySetups({ isApproved: true, limit: 6 });

  async function handleAddToCart(product: Product) {
    'use server';
    console.log('Add to cart:', product.id);
  }

  const heroVariant: 'luxury' | 'minimal' | '3d' =
    FEATURES.threejs ? '3d' : bestSellers.length > 1 ? 'luxury' : 'minimal';
  const productOfWeek = bestSellers[0] ?? newArrivals[0] ?? recommended[0];
  const heroProduct = bestSellers[1] ?? bestSellers[0] ?? recommended[0];
  const equipmentPick = bestSellers.find((p) => p.category.toLowerCase().includes('filter')) ?? recommended[1] ?? bestSellers[0];

  return (
    <>
      <WaveScrollEffect />

      <section data-wave-section className="space-y-8">
        {heroVariant === 'luxury' && heroProduct ? (
          <LuxuryProductShowcase product={heroProduct} subtitle="Flagship hero" />
        ) : heroVariant === '3d' ? (
          <EnhancedAquariumScene className="rounded-3xl border border-border/50 shadow-2xl" />
        ) : (
          <MinimalHero />
        )}
      </section>

      {productOfWeek && (
        <section data-wave-section className="mt-10">
          <ProductOfTheWeek product={productOfWeek} />
        </section>
      )}

      <section data-wave-section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-background/80 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-foreground">🎣 Find your fish</h3>
          <p className="mt-2 text-muted-foreground">
            Take the quick finder to get smart picks for your tank.
          </p>
          <div className="mt-4 flex gap-3">
            <HeroCTA href="/fish-finder" label="Start finder" />
            <HeroCTA href="/journey" label="View journey" variant="ghost" />
          </div>
        </div>
        <div className="rounded-2xl border bg-background/80 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-foreground">🧭 Journey</h3>
          <p className="mt-2 text-muted-foreground">
            Four steps from empty glass to thriving tank—track your progress.
          </p>
          <div className="mt-4 flex gap-3">
            <HeroCTA href="/journey" label="Continue journey" />
          </div>
        </div>
      </section>

      <FeaturedCategories />

      {recommended.length > 0 && (
        <RecommendedRail products={recommended} className="mt-8" />
      )}

      {gallerySetups.length > 0 && (
        <section data-wave-section className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Community builds</h3>
            <HeroCTA href="/gallery" label="View all" variant="ghost" />
          </div>
          <MasonryGalleryGrid setups={gallerySetups} locale={params.locale as Locale} />
        </section>
      )}

      <section data-wave-section className="mt-12 rounded-3xl border bg-gradient-to-br from-emerald-900 via-emerald-800 to-sky-900 p-8 text-white shadow-2xl">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-white/70">Sustainability</p>
          <h3 className="text-2xl font-semibold">Cleaner water, lighter footprint</h3>
          <p className="max-w-2xl text-white/85">
            We donate 1% of every order to protect Iraqi rivers and spotlight eco-friendly gear.
          </p>
          <HeroCTA href="/sustainability" label="See our pledge" />
        </div>
      </section>

      {equipmentPick && (
        <section data-wave-section className="mt-12">
          <LuxuryProductShowcase product={equipmentPick} subtitle="Equipment spotlight" />
        </section>
      )}

      <BestSellers products={bestSellers} onAddToCart={handleAddToCart} />
      <CalculatorsShowcase />
      <TrustBadges />
      <NewArrivals products={newArrivals} onAddToCart={handleAddToCart} />
      <DynamicInstagram />
      <DynamicQuickGuides />
    </>
  );
}

function HeroCTA({
  href,
  label,
  variant = 'primary',
}: {
  href: string;
  label: string;
  variant?: 'primary' | 'ghost';
}) {
  const className =
    variant === 'primary'
      ? 'inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg transition hover:-translate-y-0.5'
      : 'inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition hover:-translate-y-0.5';
  return (
    <a href={href} className={className}>
      {label} <span aria-hidden>→</span>
    </a>
  );
}
