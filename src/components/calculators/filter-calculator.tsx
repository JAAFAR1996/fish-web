'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';

import { Input, Badge } from '@/components/ui';
import { CalculatorResult } from './calculator-result';
import { ProductRecommendations } from './product-recommendations';
import {
  calculateFilterFlowRate,
  validateFilterInputs,
  getBioloadMultiplier,
} from '@/lib/calculators/filter-calculator';
import { getRecommendedFilters } from '@/lib/calculators/product-recommendations';
import type {
  FilterCalculationInputs,
  FilterCalculationResult,
  BioloadLevel,
  Product,
} from '@/types';

const INITIAL_INPUTS: FilterCalculationInputs = {
  tankVolume: 200,
  bioload: 'medium',
};

const BIOLOAD_ORDER: BioloadLevel[] = ['low', 'medium', 'high'];

export interface FilterCalculatorProps {
  onSaveCalculation?: (
    payload: {
      inputs: FilterCalculationInputs;
      result: FilterCalculationResult;
      products: Product[];
    }
  ) => Promise<void> | void;
  canSave?: boolean;
  initialInputs?: Partial<FilterCalculationInputs>;
}

export function FilterCalculator({
  onSaveCalculation,
  canSave = false,
  initialInputs,
}: FilterCalculatorProps) {
  const t = useTranslations('calculators.filter');
  const tCommon = useTranslations('calculators.common.unit');
  const tTabs = useTranslations('calculators.tabs');
  const tValidation = useTranslations('calculators.filter.validation');
  const tRecommendations = useTranslations('calculators.recommendations');

  const mergedInitialInputs = useMemo(
    () => ({
      ...INITIAL_INPUTS,
      ...initialInputs,
    }),
    [initialInputs]
  );
  const [inputs, setInputs] =
    useState<FilterCalculationInputs>(mergedInitialInputs);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<FilterCalculationResult | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInputs(mergedInitialInputs);
  }, [mergedInitialInputs]);

  const handleTankVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const numericValue = Number(event.target.value);
    setInputs((prev) => ({
      ...prev,
      tankVolume: Number.isNaN(numericValue) ? prev.tankVolume : numericValue,
    }));
  };

  const handleBioloadChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setInputs((prev) => ({
      ...prev,
      bioload: event.target.value as BioloadLevel,
    }));
  };

  useEffect(() => {
    const validation = validateFilterInputs(inputs);
    setErrors(validation.errors);

    if (!validation.valid) {
      setResult(null);
      setProducts([]);
      return;
    }

    const calculation = calculateFilterFlowRate(inputs);
    setResult(calculation);

    let cancelled = false;
    setIsLoadingProducts(true);
    getRecommendedFilters(calculation.recommendedFlowRate, inputs.tankVolume)
      .then((recommended) => {
        if (!cancelled) {
          setProducts(recommended);
          setIsLoadingProducts(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setProducts([]);
          setIsLoadingProducts(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [inputs]);

  const errorMessages = useMemo(
    () => errors.map((key) => tValidation(key)),
    [errors, tValidation]
  );

  const handleSave = async () => {
    if (!result || !onSaveCalculation) return;
    try {
      setIsSaving(true);
      await onSaveCalculation({
        inputs,
        result,
        products,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Input
          type="number"
          min={1}
          label={`${t('tankVolume')} · ${tCommon('liters')}`}
          value={inputs.tankVolume}
          onChange={handleTankVolumeChange}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            {t('bioload')}
          </label>
          <select
            value={inputs.bioload}
            onChange={handleBioloadChange}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {BIOLOAD_ORDER.map((level) => (
              <option key={level} value={level}>
                {t(`bioload${level.charAt(0).toUpperCase()}${level.slice(1)}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {errorMessages.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <ul className="list-disc ps-5 space-y-1">
            {errorMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      )}

      {result && (
        <CalculatorResult
          label={t('result')}
          value={result.requiredFlowRate}
          unit={t('resultUnit')}
          status={result.status}
          recommendation={t('recommendationText', {
            flow: result.recommendedFlowRate,
          })}
          formula={t('formula', { multiplier: getBioloadMultiplier(inputs.bioload) })}
          helpText={t('helpText')}
          min={0}
          max={result.recommendedFlowRate * 1.5}
          visual="progress"
          canSave={canSave}
          isSaving={isSaving}
          onSave={handleSave}
        />
      )}

      {result && (
        <div className="space-y-4">
          <Badge variant="secondary" className="w-fit">
            {tRecommendations('matchesYourNeeds')}
          </Badge>
          {isLoadingProducts ? (
            <p className="text-sm text-muted-foreground">
              {tRecommendations('loading')}
            </p>
          ) : (
            <ProductRecommendations
              products={products}
              categorySlug="filtration"
              categoryLabel={tTabs('filter')}
            />
          )}
        </div>
      )}
    </div>
  );
}
