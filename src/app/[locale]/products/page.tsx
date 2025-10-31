import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { getProductsWithFlashSalesStatus } from '@/lib/data/products';
import { ProductListing } from '@/components/products';

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

  const { products: initialProducts, hadError } = await getProductsWithFlashSalesStatus();

  return <ProductListing initialProducts={initialProducts} hadError={hadError} />;
}
