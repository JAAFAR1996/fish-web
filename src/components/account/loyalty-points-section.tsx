'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { cn, formatCurrency } from '@/lib/utils';
import type { LoyaltyPointsSummary } from '@/types';
import { calculatePointsDiscount } from '@/lib/marketing/loyalty-helpers';
import { LoyaltyProgress } from '@/components/marketing/loyalty-progress';

interface LoyaltyPointsSectionProps {
  summary: LoyaltyPointsSummary | null;
  className?: string;
}

const TRANSACTION_TYPE_CLASSNAMES: Record<string, string> = {
  earned: 'text-emerald-600 dark:text-emerald-400',
  redeemed: 'text-rose-600 dark:text-rose-400',
  expired: 'text-amber-600 dark:text-amber-400',
};

export function LoyaltyPointsSection({ summary, className }: LoyaltyPointsSectionProps) {
  const locale = useLocale();
  const resolvedLocale = locale === 'ar' ? 'ar' : 'en';
  const t = useTranslations('account.loyalty');
  const tMarketing = useTranslations('marketing.loyalty');

  const balance = summary?.balance ?? 0;
  const totalEarned = summary?.totalEarned ?? 0;
  const totalRedeemed = summary?.totalRedeemed ?? 0;
  const potentialDiscount = calculatePointsDiscount(balance);
  const recentTransactions = summary?.recentTransactions ?? [];

  const formattedTransactions = useMemo(
    () =>
      recentTransactions.map((transaction) => {
        const type = transaction.transaction_type;
        const points =
          transaction.transaction_type === 'redeemed'
            ? -Math.abs(transaction.points)
            : Math.abs(transaction.points);
        const sign = points >= 0 ? '+' : '-';
        const absolutePoints = Math.abs(points);
        const typeLabel = tMarketing(type);
        const description = transaction.description ?? typeLabel;
        const date = new Intl.DateTimeFormat(resolvedLocale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(new Date(transaction.created_at));

        return {
          id: transaction.id,
          type,
          typeLabel,
          description,
          date,
          pointsDisplay: `${sign}${absolutePoints}`,
        };
      }),
    [recentTransactions, resolvedLocale, tMarketing]
  );

  return (
    <section className={cn('space-y-6', className)}>
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">{t('balance')}</p>
          <p className="mt-2 text-3xl font-bold text-foreground">
            {t('pointsValue', { points: balance })}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('potentialDiscount', {
              amount: formatCurrency(potentialDiscount, resolvedLocale),
            })}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">{t('totalEarned')}</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            +{t('pointsValue', { points: totalEarned })}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">{t('totalRedeemed')}</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600 dark:text-rose-400">
            -{t('pointsValue', { points: totalRedeemed })}
          </p>
        </div>
      </div>

      <LoyaltyProgress summary={summary} />

      <div className="rounded-lg border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-lg font-semibold text-foreground">{t('latestActivity')}</h3>
        </div>
        {formattedTransactions.length > 0 ? (
          <ul className="divide-y divide-border">
            {formattedTransactions.map((transaction) => (
              <li
                key={transaction.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      TRANSACTION_TYPE_CLASSNAMES[transaction.type] ?? 'text-foreground'
                    )}
                  >
                    {transaction.typeLabel}
                  </p>
                  <p className="text-sm text-muted-foreground">{transaction.description}</p>
                </div>
                <div className="flex items-end justify-between gap-4 sm:flex-col sm:items-end">
                  <span className="text-sm text-muted-foreground">{transaction.date}</span>
                  <span className="text-lg font-semibold text-foreground">
                    {transaction.pointsDisplay} {tMarketing('points')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-6 text-sm text-muted-foreground">{t('noActivity')}</div>
        )}
      </div>
    </section>
  );
}
