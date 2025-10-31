import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';

import { getUser } from '@/lib/auth/utils';
import { getCartWithItems } from '@/lib/cart/cart-queries';
import { CartPageContent } from '@/components/cart';

type CartPageProps = {
  params: { locale: string };
};

export async function generateMetadata({
  params,
}: CartPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'cart' });

  return {
    title: t('title'),
    description: t('description'),
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      languages: {
        ar: '/ar/cart',
        en: '/en/cart',
      },
    },
  };
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = params;
  setRequestLocale(locale);

  const user = await getUser();
  const initialData = user ? await getCartWithItems(user.id) : null;

  return <CartPageContent initialData={initialData ?? undefined} />;
}
