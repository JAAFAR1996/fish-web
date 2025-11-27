'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import type { JourneyStep } from '@/types';

type JourneyProgressProps = {
  steps: JourneyStep[];
  currentStep: number;
  onStepChange?: (stepId: number) => void;
};

export function JourneyProgress({ steps, currentStep, onStepChange }: JourneyProgressProps) {
  const t = useTranslations('journey');
  const progress = useMemo(
    () => Math.min((currentStep / Math.max(steps.length, 1)) * 100, 100),
    [currentStep, steps.length],
  );

  return (
    <div className="space-y-4 rounded-2xl border bg-background/80 p-4 shadow-md">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t('title')}</span>
        <span>
          {currentStep}/{steps.length}
        </span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-aqua-500 to-cyan-400"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2 text-center text-xs font-medium">
        {steps.map((step) => {
          const isActive = step.id === currentStep;
          const isComplete = step.id < currentStep || step.completed;
          return (
            <div
              key={step.id}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg border bg-muted/40 p-2 transition-all',
                isActive && 'border-aqua-500 bg-aqua-50 text-foreground',
                isComplete && 'border-emerald-400 bg-emerald-50 text-emerald-700',
                onStepChange && 'cursor-pointer hover:border-aqua-500 hover:bg-aqua-50/60'
              )}
              role={onStepChange ? 'button' : undefined}
              tabIndex={onStepChange ? 0 : -1}
              onClick={() => onStepChange?.(step.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onStepChange?.(step.id);
                }
              }}
            >
              <span aria-hidden>{step.icon}</span>
              <span>{step.title}</span>
              {isComplete && <span className="text-xs text-emerald-600">✓</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
