'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import {
  Badge,
  Button,
  Gauge,
  ProgressBar,
  type GaugeProps,
} from '@/components/ui';
import { cn } from '@/lib/utils';

type StatusVariant = 'optimal' | 'adequate' | 'insufficient';
type VisualType = 'gauge' | 'progress';

const STATUS_VARIANT_MAP: Record<StatusVariant, 'success' | 'warning' | 'destructive'> = {
  optimal: 'success',
  adequate: 'warning',
  insufficient: 'destructive',
};

export interface CalculatorResultProps {
  label: string;
  value: number;
  unit: string;
  status: StatusVariant;
  recommendation: string;
  formula?: string;
  helpText?: string;
  min?: number;
  max?: number;
  visual?: VisualType;
  className?: string;
  canSave?: boolean;
  isSaving?: boolean;
  onSave?: () => void;
}

export function CalculatorResult({
  label,
  value,
  unit,
  status,
  recommendation,
  formula,
  helpText,
  min = 0,
  max = 100,
  visual = 'gauge',
  className,
  canSave = false,
  isSaving = false,
  onSave,
}: CalculatorResultProps) {
  const tResults = useTranslations('calculators.results');
  const tSave = useTranslations('calculators.save');

  const statusLabel = useMemo(() => tResults(status), [status, tResults]);

  const saveButtonDisabled = !canSave || isSaving;
  const showDisabledMessage = !canSave;

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-background shadow-sm',
        'p-6 sm:p-8 space-y-6',
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {tResults('yourResult')}
          </p>
          <h3 className="text-3xl font-bold text-foreground mt-1">
            {value}{' '}
            <span className="text-base font-medium text-muted-foreground">
              {unit}
            </span>
          </h3>
        </div>
        <Badge variant={STATUS_VARIANT_MAP[status]} className="w-fit">
          {statusLabel}
        </Badge>
      </div>

      {visual === 'gauge' ? (
        <Gauge
          value={value}
          min={min}
          max={max}
          label={label}
          unit={unit}
          status={status}
          showValue={false}
          className="motion-safe:animate-gauge-container"
        />
      ) : (
        <ProgressBar
          value={value}
          min={min}
          max={max}
          label={label}
          unit={unit}
          status={status}
          showPercentage
          className="motion-safe:animate-progress-container"
        />
      )}

      <div className="space-y-2">
        <p className="text-base font-semibold text-foreground">
          {tResults('recommendation')}
        </p>
        <p className="text-sm text-muted-foreground">{recommendation}</p>
      </div>

      {(formula || helpText) && (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 p-4 space-y-2">
          {formula && (
            <p className="text-sm font-medium text-muted-foreground">
              {formula}
            </p>
          )}
          {helpText && (
            <p className="text-sm text-muted-foreground">{helpText}</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={saveButtonDisabled}
          onClick={onSave}
        >
          {isSaving ? tSave('saving') : tSave('button')}
        </Button>
        {showDisabledMessage && (
          <p className="text-sm text-muted-foreground">
            {tSave('signInRequired')}
          </p>
        )}
      </div>
    </div>
  );
}

