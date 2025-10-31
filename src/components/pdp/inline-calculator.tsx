'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
} from '@/components/ui';
import {
  FilterCalculator,
  HeaterCalculator,
} from '@/components/calculators';
import { cn } from '@/lib/utils';
import type {
  FilterCalculationInputs,
  Product,
} from '@/types';

export interface InlineCalculatorProps {
  product: Product;
  canSave?: boolean;
  onSaveCalculation?: (payload: unknown) => Promise<void> | void;
  className?: string;
}

const numberFormatters = new Map<string, Intl.NumberFormat>();

function formatVolume(value: number, locale: string) {
  if (!numberFormatters.has(locale)) {
    numberFormatters.set(
      locale,
      new Intl.NumberFormat(locale === 'ar' ? 'ar-IQ' : 'en-US', {
        maximumFractionDigits: 0,
      })
    );
  }
  return numberFormatters.get(locale)!.format(value);
}

export function InlineCalculator({
  product,
  canSave,
  onSaveCalculation,
  className,
}: InlineCalculatorProps) {
  const t = useTranslations('pdp.calculator');
  const locale = useLocale();

  const category = product.category;
  const compatibility = product.specifications.compatibility;

  const heaterInitialInputs = useMemo(() => {
    if (category !== 'heating') {
      return null;
    }

    const power = product.specifications.power ?? 0;
    const fallbackVolume =
      power > 0 ? Math.max(20, Math.round(power / 1.5)) : 200;
    const tankVolume =
      compatibility.minTankSize ?? fallbackVolume;

    return {
      tankVolume,
      currentTemp: 24,
      targetTemp: 26,
    };
  }, [category, compatibility.minTankSize, product.specifications.power]);

  const filterInitialInputs = useMemo<FilterCalculationInputs | null>(() => {
    if (category !== 'filtration') {
      return null;
    }

    const flow = product.specifications.flow ?? 0;
    const fallbackVolume =
      flow > 0 ? Math.max(40, Math.round(flow / 6)) : 200;
    const tankVolume =
      compatibility.minTankSize ?? fallbackVolume;

    return {
      tankVolume,
      bioload: 'medium',
    };
  }, [category, compatibility.minTankSize, product.specifications.flow]);

  const tankRange = useMemo(() => {
    const min =
      compatibility.minTankSize ??
      (heaterInitialInputs?.tankVolume ?? filterInitialInputs?.tankVolume ?? 100);
    const max =
      compatibility.maxTankSize ??
      Math.round((heaterInitialInputs?.tankVolume ?? filterInitialInputs?.tankVolume ?? 100) * 1.5);

    return {
      min,
      max,
    };
  }, [
    compatibility.maxTankSize,
    compatibility.minTankSize,
    filterInitialInputs?.tankVolume,
    heaterInitialInputs?.tankVolume,
  ]);

  if (category !== 'heating' && category !== 'filtration') {
    return null;
  }

  const iconName = category === 'heating' ? 'thermometer' : 'filter';
  const calculatorTitle = t('title');

  return (
    <Card className={cn('border border-border/70 shadow-sm', className)}>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon name={iconName} size="sm" />
          <Badge variant="outline" className="border-aqua-500/40 text-aqua-600 dark:text-aqua-300">
            {t('title')}
          </Badge>
        </div>
        <CardTitle className="text-xl font-semibold text-foreground">
          {calculatorTitle}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-lg border border-aqua-500/40 bg-aqua-500/10 p-4 text-sm text-aqua-900 dark:text-aqua-100">
          <div className="flex items-center gap-2">
            <Icon
              name="help"
              size="sm"
              className="text-aqua-600 dark:text-aqua-200"
            />
            <span className="font-medium">{t('suitableFor')}</span>
          </div>
          <p className="mt-2">
            {t('tankSizeRange', {
              min: formatVolume(tankRange.min, locale),
              max: formatVolume(tankRange.max, locale),
            })}
          </p>
        </div>

        {category === 'heating' && heaterInitialInputs && (
          <HeaterCalculator
            canSave={canSave}
            onSaveCalculation={onSaveCalculation}
            initialInputs={heaterInitialInputs}
          />
        )}

        {category === 'filtration' && filterInitialInputs && (
          <FilterCalculator
            canSave={canSave}
            onSaveCalculation={onSaveCalculation}
            initialInputs={filterInitialInputs}
          />
        )}
      </CardContent>
    </Card>
  );
}
