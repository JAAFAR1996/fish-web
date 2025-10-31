'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import type { ReferralStats } from '@/types';
import { ReferralShareCard } from '@/components/marketing/referral-share-card';
import { ensureReferralCodeAction } from '@/lib/marketing/referral-actions';
import { Button, Icon } from '@/components/ui';
import { cn } from '@/lib/utils';
import { REFERRAL_REWARD_POINTS, REFEREE_REWARD_POINTS } from '@/lib/marketing/constants';

interface ReferralsSectionProps {
  stats: ReferralStats | null;
  referralCode: string | null;
  className?: string;
}

export function ReferralsSection({ stats, referralCode, className }: ReferralsSectionProps) {
  const locale = useLocale();
  const resolvedLocale = locale === 'ar' ? 'ar' : 'en';
  const t = useTranslations('account.referrals');
  const tMarketing = useTranslations('marketing.referrals');
  const tLoyalty = useTranslations('marketing.loyalty');
  const [code, setCode] = useState(referralCode);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [isGenerating, startTransition] = useTransition();
  const numberFormatter = useMemo(() => new Intl.NumberFormat(resolvedLocale), [resolvedLocale]);

  const handleGenerateCode = useCallback(() => {
    startTransition(async () => {
      setGenerateError(null);
      const result = await ensureReferralCodeAction();
      if (!result.success || !result.code) {
        setGenerateError(result.error ?? 'generateFailed');
        return;
      }
      setCode(result.code);
    });
  }, []);

  const statsItems = useMemo(
    () => [
      {
        label: tMarketing('totalReferrals'),
        value: numberFormatter.format(stats?.totalReferrals ?? 0),
        icon: 'users',
      },
      {
        label: tMarketing('completedReferrals'),
        value: numberFormatter.format(stats?.completedReferrals ?? 0),
        icon: 'check-circle',
      },
      {
        label: tMarketing('pendingRewards'),
        value: numberFormatter.format(stats?.pendingRewards ?? 0),
        icon: 'clock',
      },
      {
        label: t('rewardPointsTitle'),
        value: `${numberFormatter.format(stats?.totalRewardsEarned ?? 0)} ${tLoyalty('points')}`,
        icon: 'gift',
      },
    ],
    [numberFormatter, stats, t, tMarketing]
  );

  return (
    <section className={cn('space-y-6', className)}>
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('subtitle', {
            reward: `${REFERRAL_REWARD_POINTS} ${tLoyalty('points')}`,
            friendReward: `${REFEREE_REWARD_POINTS} ${tLoyalty('points')}`,
          })}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsItems.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name={item.icon as any} size="sm" />
              <span>{item.label}</span>
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>

      {code ? (
        <ReferralShareCard referralCode={code} />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/40 p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground">{t('noCodeTitle')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t('noCodeDescription')}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="primary"
              onClick={handleGenerateCode}
              loading={isGenerating}
            >
              {t('generateCode')}
            </Button>
          </div>
          {generateError && (
            <p className="mt-3 text-sm text-destructive">
              {tMarketing(generateError as Parameters<typeof tMarketing>[0])}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-foreground">{tMarketing('howItWorks')}</h4>
          <ol className="list-decimal space-y-2 ps-5 text-sm text-muted-foreground">
            <li>{tMarketing('step1')}</li>
            <li>{tMarketing('step2')}</li>
            <li>{tMarketing('step3')}</li>
          </ol>
        </div>
        <div className="space-y-3 rounded-lg border border-border bg-card p-5 shadow-sm">
          <h4 className="text-lg font-semibold text-foreground">{tMarketing('benefits')}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-emerald-500" />
              {tMarketing('freeShipping')}
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-emerald-500" />
              {tMarketing('exclusiveDeals')}
            </li>
            <li className="flex items-center gap-2">
              <Icon name="check" size="sm" className="text-emerald-500" />
              {tMarketing('expertAdvice')}
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
