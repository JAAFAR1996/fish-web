import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import * as Sentry from '@sentry/nextjs';
import { getProductsWithFlashSalesStatus, getRecommendedProducts, getStaticFallbackProducts } from '@/lib/data/products';
import { ProductListing } from '@/components/products';
import type { ProductWithFlashSale } from '@/types';

interface ProductsPageProps {
  params: { locale: string };
}

export const revalidate = 1800; // 30 minutes ISR

export async function generateMetadata({
  params,
}: ProductsPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'plp' });

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
  };
}

export default async function ProductsPage({ params }: ProductsPageProps) {
  const { locale } = params;
  setRequestLocale(locale);

  let productsResult: { products: ProductWithFlashSale[]; hadError: boolean };
  try {
    productsResult = await getProductsWithFlashSalesStatus();
  } catch (error) {
    console.error('[ProductsPage] Falling back to static products:', error);
    Sentry.captureException(error);
    const fallback = getStaticFallbackProducts();
    return (
      <ProductListing
        initialProducts={fallback}
        hadError
        recommendedProducts={fallback.slice(0, 8)}
      />
    );
  }

  let recommendedProducts: ProductWithFlashSale[] = [];
  let hadError = productsResult.hadError;

  try {
    recommendedProducts = await getRecommendedProducts(8);
  } catch (error) {
    console.error('[ProductsPage] Failed to build recommendations, using fallback list:', error);
    Sentry.captureException(error);
    recommendedProducts = productsResult.products.slice(0, 8);
    hadError = true;
  }

  return (
    <ProductListing
      initialProducts={productsResult.products}
      hadError={hadError}
      recommendedProducts={recommendedProducts}
    />
  );
}
