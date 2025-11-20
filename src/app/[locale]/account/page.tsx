import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { AccountTabs } from '@/components/account';
import { getUser, getUserProfile, getSession } from '@/lib/auth/utils';
import { getLoyaltyPointsSummary } from '@/lib/marketing/loyalty-utils';
import { getUserReferralStats } from '@/lib/marketing/referral-utils-server';
import { routing } from '@/i18n/routing';
import { db } from '@server/db';
import { profiles } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

type Locale = (typeof routing.locales)[number];

interface AccountPageProps {
  params: { locale: string };
  searchParams?: { tab?: string };
}

function assertLocale(locale: string): asserts locale is Locale {
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: 'account' });

  return {
    title: t('title'),
    description: t('description'),
    robots: 'noindex, nofollow',
  };
}

const VALID_TABS = new Set([
  'profile',
  'orders',
  'wishlist',
  'addresses',
  'loyalty',
  'referrals',
  'settings',
]);

export default async function AccountPage({ params, searchParams }: AccountPageProps) {
  const { locale } = params;
  assertLocale(locale);
  setRequestLocale(locale);

  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  const session = await getSession();
  const profile = await getUserProfile(user.id);
  const [loyaltySummary, referralStats, preferencesRow] = await Promise.all([
    getLoyaltyPointsSummary(user.id),
    getUserReferralStats(user.id),
    db
      .select({
        emailOrderUpdates: profiles.emailOrderUpdates,
        emailShippingUpdates: profiles.emailShippingUpdates,
        emailStockAlerts: profiles.emailStockAlerts,
        emailMarketing: profiles.emailMarketing,
        inappNotificationsEnabled: profiles.inappNotificationsEnabled,
      })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)
      .then((rows) => rows[0] ?? null),
  ]);

  const notificationPrefs = {
    email_order_updates: preferencesRow?.emailOrderUpdates ?? true,
    email_shipping_updates: preferencesRow?.emailShippingUpdates ?? true,
    email_stock_alerts: preferencesRow?.emailStockAlerts ?? true,
    email_marketing: preferencesRow?.emailMarketing ?? false,
    inapp_notifications_enabled: preferencesRow?.inappNotificationsEnabled ?? true,
  };
  const defaultTab = searchParams?.tab && VALID_TABS.has(searchParams.tab)
    ? (searchParams.tab as Parameters<typeof AccountTabs>[0]['defaultTab'])
    : 'profile';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <AccountTabs
        user={user}
        session={session}
        profile={profile}
        loyaltySummary={loyaltySummary}
        referralStats={referralStats}
        referralCode={profile?.referral_code ?? null}
        notificationPrefs={notificationPrefs}
        defaultTab={defaultTab}
      />
    </div>
  );
}
