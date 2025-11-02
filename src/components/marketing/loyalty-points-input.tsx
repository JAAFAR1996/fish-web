'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button, Input } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';
import type { Locale } from '@/types';
import { calculatePointsDiscount } from '@/lib/marketing/loyalty-helpers';

interface LoyaltyPointsInputProps {
  balance: number;
  appliedPoints: number;
  appliedDiscount: number;
  onApply: (points: number) => void;
  onRemove: () => void;
  errorMessage?: string | null;
  disabled?: boolean;
  isGuest?: boolean;
  className?: string;
}

export function LoyaltyPointsInput({
  balance,
  appliedPoints,
  appliedDiscount,
  onApply,
  onRemove,
  errorMessage,
  disabled = false,
  isGuest = false,
  className,
}: LoyaltyPointsInputProps) {
  const locale = useLocale();
  const resolvedLocale: Locale = locale === 'ar' ? 'ar' : 'en';
  const t = useTranslations('marketing.loyalty');
  const [inputValue, setInputValue] = useState(appliedPoints > 0 ? String(appliedPoints) : '');

  useEffect(() => {
    setInputValue(appliedPoints > 0 ? String(appliedPoints) : '');
  }, [appliedPoints]);

  const previewPoints = Number.parseInt(inputValue, 10);
  const previewDiscount = useMemo(() => {
    if (Number.isNaN(previewPoints) || previewPoints <= 0) {
      return 0;
    }
    return calculatePointsDiscount(previewPoints);
  }, [previewPoints]);

  const handleApplyClick = () => {
    const parsed = Number.parseInt(inputValue, 10);
    if (Number.isNaN(parsed)) {
      onApply(0);
      return;
    }
    onApply(parsed);
  };

  const handleUseMax = () => {
    setInputValue(String(balance));
    onApply(balance);
  };

  const handleRemove = () => {
    setInputValue('');
    onRemove();
  };

  const isApplyDisabled = disabled || balance <= 0;
  const isRemoveVisible = appliedPoints > 0;

  return (
    <section
      className={cn(
        'space-y-4 rounded-lg border border-border bg-background p-4 shadow-sm transition-opacity',
        isApplyDisabled ? 'opacity-90' : 'opacity-100',
        className
      )}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {t('redeemPoints')}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t('redeemInfo')}
          </p>
        </div>
        <span className="text-sm font-medium text-foreground">
          {t('youHave', { balance })}
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="number"
          min={0}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={t('enterPoints')}
          disabled={isApplyDisabled}
          className="sm:max-w-[180px]"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isApplyDisabled}
            onClick={handleApplyClick}
          >
            {t('apply')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isApplyDisabled || balance <= 0}
            onClick={handleUseMax}
          >
            {t('applyPoints', { points: balance })}
          </Button>
          {isRemoveVisible && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
            >
              {t('remove')}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>{t('earnInfo')}</p>
        {appliedDiscount > 0 && (
          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            {t('applied', { points: appliedPoints })}{' '}
            • {t('discount', { amount: formatCurrency(appliedDiscount, resolvedLocale) })}
          </p>
        )}
        {previewDiscount > 0 && appliedDiscount === 0 && (
          <p>
            {t('discount', { amount: formatCurrency(previewDiscount, resolvedLocale) })}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {t('redeemRate', {
            points: 100,
            amount: formatCurrency(calculatePointsDiscount(100), resolvedLocale),
          })}
        </p>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {isGuest && disabled && (
        <p className="text-xs text-muted-foreground">
          {t('loginRequired')}
        </p>
      )}

      {isApplyDisabled && !isGuest && balance <= 0 && (
        <p className="text-xs text-muted-foreground">
          {t('noTransactions')}
        </p>
      )}
    </section>
  );
}
