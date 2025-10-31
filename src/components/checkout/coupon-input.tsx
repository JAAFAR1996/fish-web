'use client';

import {
  useCallback,
  useMemo,
  useState,
  useTransition,
} from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button, Icon, Input } from '@/components/ui';
import { applyCouponAction } from '@/lib/checkout/checkout-actions';
import { validateCouponCode } from '@/lib/checkout/validation';
import { formatCurrency } from '@/lib/utils';
import type { Locale } from '@/types';

export interface CouponInputProps {
  subtotal: number;
  onApply: (code: string, discount: number) => void;
  onRemove: () => void;
  appliedCode?: string | null;
  appliedDiscount?: number | null;
  className?: string;
}

export function CouponInput({
  subtotal,
  onApply,
  onRemove,
  appliedCode = null,
  appliedDiscount = null,
  className,
}: CouponInputProps) {
  const t = useTranslations('checkout.coupon');
  const translate = useTranslations();
  const locale = useLocale();
  const resolvedLocale: Locale = locale === 'ar' ? 'ar' : 'en';

  const [code, setCode] = useState('');
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [errorParams, setErrorParams] = useState<Record<string, string | number> | undefined>();
  const [isPending, startTransition] = useTransition();

  const errorMessage = useMemo(() => {
    if (!errorKey) {
      return null;
    }
    try {
      return translate(errorKey, errorParams);
    } catch {
      return translate('checkout.errors.orderFailed');
    }
  }, [errorKey, errorParams, translate]);

  const handleApply = useCallback(() => {
    setErrorKey(null);
    setErrorParams(undefined);
    const validation = validateCouponCode(code);
    if (!validation.valid) {
      const key = validation.errors.coupon ?? 'checkout.coupon.invalidCode';
      setErrorKey(key);
      return;
    }

    startTransition(async () => {
      const result = await applyCouponAction(code, subtotal);
      if (!result.success || typeof result.discount !== 'number') {
        setErrorKey(result.error ?? 'checkout.coupon.invalidCode');
        setErrorParams(result.params);
        return;
      }
      onApply(code, result.discount);
      setCode('');
    });
  }, [code, onApply, subtotal]);

  const handleRemove = useCallback(() => {
    setCode('');
    setErrorKey(null);
    setErrorParams(undefined);
    onRemove();
  }, [onRemove]);

  if (appliedCode && appliedDiscount != null) {
    return (
      <div
        className={className}
      >
        <div className="flex items-center justify-between rounded-lg border border-aqua-500 bg-aqua-50 px-4 py-3 text-sm text-aqua-700 dark:bg-aqua-950/20 dark:text-aqua-200">
          <div className="flex items-center gap-2">
            <Icon name="tag" className="h-4 w-4" aria-hidden="true" />
            <div className="flex flex-col">
              <span className="font-medium uppercase tracking-wider">
                {appliedCode}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('discount')}: {formatCurrency(appliedDiscount, resolvedLocale)}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            aria-label={t('remove')}
          >
            <Icon name="trash" className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label={t('label')}
            placeholder={t('placeholder')}
            value={code}
            onChange={(event) => {
              setCode(event.target.value.toUpperCase());
              if (errorKey) {
                setErrorKey(null);
                setErrorParams(undefined);
              }
            }}
            disabled={isPending}
            error={Boolean(errorMessage)}
            helperText={
              errorMessage ??
              undefined
            }
          />
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-2 sm:mt-0 sm:w-auto"
          loading={isPending}
          disabled={!code || isPending}
          onClick={handleApply}
        >
          {t('apply')}
        </Button>
      </div>
    </div>
  );
}
