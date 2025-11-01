import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ReferralLandingContent } from '@/components/marketing/referral-landing-content';
import { getReferralByCode } from '@/lib/marketing/referral-utils-server';
import { routing } from '@/i18n/routing';

type Locale = (typeof routing.locales)[number];

interface ReferralPageProps {
  params: { locale: string; code: string };
}

function assertLocale(locale: string): asserts locale is Locale {
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }
}

export async function generateMetadata({ params }: ReferralPageProps): Promise<Metadata> {
  const { locale } = params;
  assertLocale(locale);
  const t = await getTranslations({ locale, namespace: 'marketing.referrals' });

  return {
    title: t('title'),
    description: t('welcomeBonus'),
  };
}

export default async function ReferralPage({ params }: ReferralPageProps) {
  const { locale, code } = params;
  assertLocale(locale);
  setRequestLocale(locale);

  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) {
    notFound();
  }

  const referral = await getReferralByCode(normalizedCode);

  if (!referral) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <ReferralLandingContent
        referralCode={normalizedCode}
        referrerName={referral.fullName}
      />
    </div>
  );
}
