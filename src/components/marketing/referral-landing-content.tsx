'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import { setReferralCookie } from '@/lib/marketing/referral-utils-client';
import { REFEREE_REWARD_POINTS, REFERRAL_REWARD_POINTS } from '@/lib/marketing/constants';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';

interface ReferralLandingContentProps {
  referralCode: string;
  referrerName: string | null;
  className?: string;
}

export function ReferralLandingContent({
  referralCode,
  referrerName,
  className,
}: ReferralLandingContentProps) {
  const locale = useLocale();
  const resolvedLocale = locale === 'ar' ? 'ar' : 'en';
  const t = useTranslations('marketing.referrals');
  const tLoyalty = useTranslations('marketing.loyalty');

  useEffect(() => {
    setReferralCookie(referralCode);
  }, [referralCode]);

  return (
    <section className={cn('mx-auto max-w-3xl space-y-8 rounded-2xl border border-border bg-card p-8 shadow-lg', className)}>
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-aqua-600 dark:text-aqua-300">
          {t('welcomeBonus')}
        </p>
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {t('signupBonus', { points: REFEREE_REWARD_POINTS })}
        </h1>
        <p className="text-sm text-muted-foreground">
          {referrerName
            ? t('invitedBy', { name: referrerName })
            : t('inviteFriends')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-4 text-center">
          <Icon name="gift" size="lg" className="mx-auto text-aqua-500" />
          <h3 className="mt-3 text-lg font-semibold text-foreground">
            {t('friendGets', {
              reward: `${REFEREE_REWARD_POINTS} ${tLoyalty('points')}`,
            })}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('signupBonus', { points: REFEREE_REWARD_POINTS })}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background p-4 text-center">
          <Icon name="sparkles" size="lg" className="mx-auto text-amber-500" />
          <h3 className="mt-3 text-lg font-semibold text-foreground">
            {t('earnReward', {
              reward: `${REFERRAL_REWARD_POINTS} ${tLoyalty('points')}`,
            })}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('inviteFriends')}
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-muted-foreground">
        <h2 className="text-center text-lg font-semibold text-foreground">{t('howItWorks')}</h2>
        <ol className={`list-decimal space-y-2 ${resolvedLocale === 'ar' ? 'pe-5 text-right' : 'ps-5 text-left'}`}>
          <li>{t('step1')}</li>
          <li>{t('step2')}</li>
          <li>{t('step3')}</li>
        </ol>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild variant="primary">
          <Link href={{ pathname: '/account' }}>
            {t('signUp')}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={{ pathname: '/products' }}>
            {t('browseProducts')}
          </Link>
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t('referralCodeLabel', { code: referralCode })}
      </p>
    </section>
  );
}
