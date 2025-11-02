'use client';

import { useCallback, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button, Icon, Input } from '@/components/ui';
import { cn } from '@/lib/utils';
import {
  REFERRAL_REWARD_POINTS,
  REFEREE_REWARD_POINTS,
} from '@/lib/marketing/constants';

interface ReferralShareCardProps {
  referralCode: string;
  className?: string;
}

export function ReferralShareCard({ referralCode, className }: ReferralShareCardProps) {
  const locale = useLocale();
  const resolvedLocale = locale === 'ar' ? 'ar' : 'en';
  const t = useTranslations('marketing.referrals');
  const tLoyalty = useTranslations('marketing.loyalty');
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const pointsLabel = tLoyalty('points');

  const shareUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/${resolvedLocale}/ref/${referralCode}`;
    }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? '';
    return `${baseUrl.replace(/\/$/, '')}/${resolvedLocale}/ref/${referralCode}`;
  }, [referralCode, resolvedLocale]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setShareError(null);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('[Referrals] Failed to copy link', error);
      setShareError('copyFailed');
    }
  }, [shareUrl]);

  const handleShare = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.share) {
      handleCopy();
      return;
    }

    try {
      await navigator.share({
        title: t('title'),
        text: t('earnReward', {
          reward: `${REFERRAL_REWARD_POINTS} ${pointsLabel}`,
        }),
        url: shareUrl,
      });
      setShareError(null);
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        console.error('[Referrals] Share API failed', error);
        setShareError('shareFailed');
      }
    }
  }, [handleCopy, pointsLabel, shareUrl, t]);

  return (
    <div className={cn('rounded-xl border border-border bg-card p-6 shadow-sm', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-aqua-600 dark:text-aqua-300">
            {t('inviteFriends')}
          </p>
          <h3 className="text-2xl font-semibold text-foreground">{t('yourCode')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('earnReward', {
              reward: `${REFERRAL_REWARD_POINTS} ${pointsLabel}`,
            })}
            {' · '}
            {t('friendGets', {
              reward: `${REFEREE_REWARD_POINTS} ${pointsLabel}`,
            })}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-md border border-dashed border-border bg-background px-4 py-2">
          <span className="text-lg font-semibold tracking-widest text-foreground">
            {referralCode}
          </span>
          <Button type="button" variant="ghost" size="icon" onClick={handleCopy}>
            <Icon name={copied ? 'check' : 'copy'} size="sm" />
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input value={shareUrl} readOnly wrapperClassName="flex-1" size="sm" />
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleCopy}>
              <Icon name="copy" size="sm" className="me-2" />
              {copied ? t('linkCopied') : t('copyLink')}
            </Button>
            <Button type="button" variant="primary" onClick={handleShare}>
              <Icon name="share" size="sm" className="me-2" />
              {t('inviteNow')}
            </Button>
          </div>
        </div>
        {shareError && (
          <p className="text-xs text-destructive">{t(shareError as Parameters<typeof t>[0])}</p>
        )}
      </div>
    </div>
  );
}
