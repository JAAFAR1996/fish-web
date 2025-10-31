import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { WishlistPageContent } from '@/components/wishlist';

type WishlistPageProps = {
  params: { locale: string };
};

export async function generateMetadata({
  params,
}: WishlistPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'wishlist' });

  return {
    title: t('title'),
    description: t('description'),
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      languages: {
        ar: '/ar/wishlist',
        en: '/en/wishlist',
      },
    },
  };
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { locale } = params;
  setRequestLocale(locale);

  return <WishlistPageContent />;
}
