import { setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/layout';
import {
  BestSellers,
  CalculatorsShowcase,
  FeaturedCategories,
  InstagramFeed,
  NewArrivals,
  QuickGuides,
  TrustBadges,
} from '@/components/home';
import { getBestSellers, getNewArrivals } from '@/lib/data/products';
import type { Product } from '@/types';

type HomePageProps = {
  params: { locale: string };
};

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = params;
  setRequestLocale(locale);

  const [bestSellers, newArrivals] = await Promise.all([
    getBestSellers(8),
    getNewArrivals(8),
  ]);

  async function handleAddToCart(product: Product) {
    'use server';
    console.log('Add to cart:', product.id);
  }

  return (
    <>
      <Hero />
      <FeaturedCategories />
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
      <InstagramFeed />
      <QuickGuides />
    </>
  );
}
