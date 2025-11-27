import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { LuxuryProductShowcase } from '@/components/products/LuxuryProductShowcase';
import { Link } from '@/i18n/navigation';
import { getProducts } from '@/lib/data/products';

export default async function FeaturedProductPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { slug?: string };
}) {
  const t = await getTranslations({ locale: params.locale, namespace: 'product' });
  const products = await getProducts();
  if (!products.length) return notFound();

  const currentSlug = searchParams.slug ?? products.find((p) => p.isBestSeller)?.slug ?? products[0].slug;
  const currentIndex = products.findIndex((p) => p.slug === currentSlug);
  const featured = currentIndex >= 0 ? products[currentIndex] : products[0];

  const prevIndex = (currentIndex - 1 + products.length) % products.length;
  const nextIndex = (currentIndex + 1) % products.length;
  const previousHref = `/products/featured?slug=${encodeURIComponent(products[prevIndex].slug)}`;
  const nextHref = `/products/featured?slug=${encodeURIComponent(products[nextIndex].slug)}`;

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <Link href="/products" className="underline underline-offset-4">
          {t('actions.viewDetails')}
        </Link>
        <span>
          {currentIndex + 1}/{products.length}
        </span>
      </div>
      <LuxuryProductShowcase
        product={featured}
        subtitle="Flagship drop"
        previousHref={previousHref}
        nextHref={nextHref}
      />
    </main>
  );
}
