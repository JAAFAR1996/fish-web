import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import type { SavedAddress } from '@/types';
import { CheckoutWizard } from '@/components/checkout';
import { getUser } from '@/lib/auth/utils';
import { getCartWithItems } from '@/lib/cart/cart-queries';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserPointsBalance } from '@/lib/marketing/loyalty-utils';

export const dynamic = 'force-dynamic';

type CheckoutPageProps = {
  params: { locale: string };
};

export async function generateMetadata({
  params,
}: CheckoutPageProps): Promise<Metadata> {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: 'checkout' });

  return {
    title: t('title'),
    description: t('description'),
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      languages: {
        ar: '/ar/checkout',
        en: '/en/checkout',
      },
    },
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { locale } = params;
  setRequestLocale(locale);

  const user = await getUser();
  let savedAddresses: SavedAddress[] = [];
  let loyaltyPointsBalance = 0;

  if (user) {
    const cart = await getCartWithItems(user.id);
    if (!cart || cart.items.length === 0) {
      redirect(`/${locale}/cart`);
    }

    loyaltyPointsBalance = await getUserPointsBalance(user.id);

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('saved_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error && data) {
      savedAddresses = data as SavedAddress[];
    }
  }

  return (
    <CheckoutWizard
      user={user}
      savedAddresses={savedAddresses}
      loyaltyPointsBalance={loyaltyPointsBalance}
    />
  );
}
