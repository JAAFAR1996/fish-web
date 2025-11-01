'use client';

import type { CheckoutStep } from '@/types';

import { useTranslations } from 'next-intl';

import { Icon } from '@/components/ui';
import { cn } from '@/lib/utils';

const STEPS: Array<{
  value: CheckoutStep;
  labelKey: string;
  icon: string;
}> = [
  { value: 'shipping', labelKey: 'shipping', icon: 'truck' },
  { value: 'payment', labelKey: 'payment', icon: 'credit-card' },
  { value: 'review', labelKey: 'review', icon: 'check' },
];

export interface CheckoutProgressProps {
  currentStep: CheckoutStep;
  completedSteps?: CheckoutStep[];
  className?: string;
}

export function CheckoutProgress({
  currentStep,
  completedSteps = [],
  className,
}: CheckoutProgressProps) {
  const t = useTranslations('checkout.steps');

  const currentIndex = STEPS.findIndex((step) => step.value === currentStep);

  return (
    <nav
      aria-label={t('stepOf', {
        current: currentIndex + 1,
        total: STEPS.length,
      })}
      className={cn('w-full', className)}
    >
      <ol className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.value);
          const isCurrent = step.value === currentStep;
          const isUpcoming = !isCompleted && !isCurrent;

          return (
            <li
              key={step.value}
              className={cn(
                'flex items-center gap-3 sm:flex-1',
                index !== STEPS.length - 1 && 'sm:pe-4'
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <div className="flex items-center gap-3 sm:flex-1">
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors motion-safe:transition-colors',
                    isCompleted && 'border-aqua-500 bg-aqua-500 text-white',
                    isCurrent &&
                      !isCompleted &&
                      'border-aqua-500 bg-aqua-500/10 text-aqua-600',
                    isUpcoming && 'border-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Icon name="check" className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Icon
                      name={step.icon as any}
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isCompleted && 'text-aqua-600',
                      isCurrent && 'text-foreground',
                      isUpcoming && 'text-muted-foreground'
                    )}
                  >
                    {t(step.labelKey)}
                  </span>
                  <span className="text-xs text-muted-foreground sm:hidden">
                    {t('stepOf', { current: index + 1, total: STEPS.length })}
                  </span>
                </div>
              </div>
              {index !== STEPS.length - 1 && (
                <div
                  className={cn(
                    'hidden h-0.5 flex-1 rounded-full sm:block',
                    completedSteps.includes(STEPS[index + 1].value)
                      ? 'bg-aqua-500'
                      : 'bg-muted'
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
