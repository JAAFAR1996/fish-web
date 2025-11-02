'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button, Icon } from '@/components/ui';
import type { PaymentMethod } from '@/types';
import { cn } from '@/lib/utils';

export interface PaymentMethodStepProps {
  initialData?: PaymentMethod | null;
  onContinue: (paymentMethod: PaymentMethod) => void;
  onBack: () => void;
  className?: string;
}

export function PaymentMethodStep({
  initialData = null,
  onContinue,
  onBack,
  className,
}: PaymentMethodStepProps) {
  const tPayment = useTranslations('checkout.payment');
  const tSteps = useTranslations('checkout.steps');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(
    initialData
  );

  const handleContinue = useCallback(() => {
    if (!selectedMethod) {
      return;
    }
    onContinue(selectedMethod);
  }, [onContinue, selectedMethod]);

  return (
    <section className={cn('space-y-8', className)}>
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{tPayment('title')}</h2>
        <p className="text-sm text-muted-foreground">{tPayment('description')}</p>
      </header>

      <div className="grid gap-4">
        <button
          type="button"
          onClick={() => setSelectedMethod('cod')}
          className={cn(
            'flex w-full items-center gap-4 rounded-lg border p-5 text-start transition-colors motion-safe:transition-colors',
            selectedMethod === 'cod'
              ? 'border-aqua-500 bg-aqua-50 dark:bg-aqua-950/20'
              : 'border-border hover:border-foreground/40'
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-aqua-500 text-white">
            <Icon name="credit-card" className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-base font-semibold text-foreground">
              {tPayment('cod')}
            </span>
            <span className="text-sm text-muted-foreground">
              {tPayment('codDescription')}
            </span>
            <span className="text-xs text-muted-foreground">
              {tPayment('codBenefits')}
            </span>
          </div>
          <span
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors motion-safe:transition-colors',
              selectedMethod === 'cod'
                ? 'border-aqua-500 bg-aqua-500'
                : 'border-muted'
            )}
            aria-hidden="true"
          >
            {selectedMethod === 'cod' && (
              <Icon name="check" className="h-3 w-3 text-white" aria-hidden="true" />
            )}
          </span>
        </button>
      </div>

      <p className="text-sm text-muted-foreground">{tPayment('comingSoon')}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>
          <Icon name="arrow-left" className="me-2 h-4 w-4" flipRtl />
          {tSteps('shipping')}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          onClick={handleContinue}
          disabled={!selectedMethod}
        >
          <span>{tPayment('continue')}</span>
          <Icon name="arrow-right" className="ms-2 h-4 w-4" flipRtl />
        </Button>
      </div>
    </section>
  );
}
