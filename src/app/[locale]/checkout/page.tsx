import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import type { SavedAddress } from '@/types';
import { CheckoutWizard } from '@/components/checkout';
import { getUser } from '@/lib/auth/utils';
import { getCartWithItems } from '@/lib/cart/cart-queries';
import { getUserPointsBalance } from '@/lib/marketing/loyalty-utils';
import { db } from '@server/db';
import { savedAddresses as savedAddressesTable } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';

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
  let userAddresses: SavedAddress[] = [];
  let loyaltyPointsBalance = 0;

  if (user) {
    const cart = await getCartWithItems(user.id);
    if (!cart || cart.items.length === 0) {
      redirect(`/${locale}/cart`);
    }

    loyaltyPointsBalance = await getUserPointsBalance(user.id);

    const rows = await db
      .select()
      .from(savedAddressesTable)
      .where(eq(savedAddressesTable.userId, user.id))
      .orderBy(desc(savedAddressesTable.isDefault), desc(savedAddressesTable.createdAt));

    userAddresses = rows.map((row) => ({
      id: row.id,
      user_id: row.userId,
      label: row.label ?? null,
      recipient_name: row.recipientName,
      phone: row.phone ?? null,
      address_line1: row.addressLine1,
      address_line2: row.addressLine2 ?? null,
      city: row.city,
      governorate: row.governorate,
      postal_code: row.postalCode ?? null,
      is_default: row.isDefault ?? false,
      created_at:
        row.createdAt instanceof Date
          ? row.createdAt.toISOString()
          : row.createdAt ?? new Date().toISOString(),
      updated_at:
        row.updatedAt instanceof Date
          ? row.updatedAt.toISOString()
          : row.updatedAt ?? new Date().toISOString(),
    }));
  }

  return (
    <CheckoutWizard
      user={user}
      savedAddresses={userAddresses}
      loyaltyPointsBalance={loyaltyPointsBalance}
    />
  );
}
