import { setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/layout';
import {
  BestSellers,
  CalculatorsShowcase,
  FeaturedCategories,
  NewArrivals,
  TrustBadges,
} from '@/components/home';
import dynamic from 'next/dynamic';
import { RecommendedRail } from '@/components/products';
import { getBestSellers, getNewArrivals, getRecommendedProducts } from '@/lib/data/products';
import type { Product } from '@/types';

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

  async function handleAddToCart(product: Product) {
    'use server';
    console.log('Add to cart:', product.id);
  }

  return (
    <>
      <Hero />
      <FeaturedCategories />
      <RecommendedRail products={recommended} className="mt-8" />
      <BestSellers
        products={bestSellers}
        onAddToCart={handleAddToCart}
      />
      <CalculatorsShowcase />
      <TrustBadges />
      <NewArrivals
        products={newArrivals}
        onAddToCart={handleAddToCart}
      />
      <DynamicInstagram />
      <DynamicQuickGuides />
    </>
  );
}
