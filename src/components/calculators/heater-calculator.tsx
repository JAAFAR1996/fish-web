'use client';

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useTranslations } from 'next-intl';

import { Input, Badge } from '@/components/ui';
import { CalculatorResult } from './calculator-result';
import { ProductRecommendations } from './product-recommendations';
import {
  calculateHeaterWattage,
  validateHeaterInputs,
} from '@/lib/calculators/heater-calculator';
import { getRecommendedHeaters } from '@/lib/calculators/product-recommendations';
import type {
  HeaterCalculationInputs,
  HeaterCalculationResult,
  Product,
} from '@/types';

const INITIAL_INPUTS: HeaterCalculationInputs = {
  tankVolume: 200,
  currentTemp: 24,
  targetTemp: 26,
};

export interface HeaterCalculatorProps {
  onSaveCalculation?: (
    payload: {
      inputs: HeaterCalculationInputs;
      result: HeaterCalculationResult;
      products: Product[];
    }
  ) => Promise<void> | void;
  canSave?: boolean;
  initialInputs?: Partial<HeaterCalculationInputs>;
}

export function HeaterCalculator({
  onSaveCalculation,
  canSave = false,
  initialInputs,
}: HeaterCalculatorProps) {
  const t = useTranslations('calculators.heater');
  const tCommon = useTranslations('calculators.common.unit');
  const tTabs = useTranslations('calculators.tabs');
  const tValidation = useTranslations('calculators.heater.validation');
  const tRecommendations = useTranslations('calculators.recommendations');
  const mergedInitialInputs = useMemo(
    () => ({
      ...INITIAL_INPUTS,
      ...initialInputs,
    }),
    [initialInputs]
  );
  const [inputs, setInputs] =
    useState<HeaterCalculationInputs>(mergedInitialInputs);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<HeaterCalculationResult | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInputs(mergedInitialInputs);
  }, [mergedInitialInputs]);

  const handleInputChange = (field: keyof HeaterCalculationInputs) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.value;
    const numericValue = value === '' ? NaN : Number(value);

    setInputs((prev) => ({
      ...prev,
      [field]: Number.isNaN(numericValue) ? prev[field] : numericValue,
    }));
  };

  useEffect(() => {
    const validation = validateHeaterInputs(inputs);
    setErrors(validation.errors);

    if (!validation.valid) {
      setResult(null);
      setProducts([]);
      return;
    }

    const calculation = calculateHeaterWattage(inputs);
    setResult(calculation);

    let cancelled = false;

    setIsLoadingProducts(true);
    getRecommendedHeaters(calculation.recommendedWattage).then((recommended) => {
      if (!cancelled) {
        setProducts(recommended);
        setIsLoadingProducts(false);
      }
    }).catch(() => {
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
      <div className="grid gap-6 md:grid-cols-3">
        <Input
          type="number"
          min={1}
          label={`${t('tankVolume')} · ${tCommon('liters')}`}
          value={inputs.tankVolume}
          onChange={handleInputChange('tankVolume')}
        />
        <Input
          type="number"
          label={`${t('currentTemp')} · ${tCommon('celsius')}`}
          value={inputs.currentTemp}
          onChange={handleInputChange('currentTemp')}
        />
        <Input
          type="number"
          label={`${t('targetTemp')} · ${tCommon('celsius')}`}
          value={inputs.targetTemp}
          onChange={handleInputChange('targetTemp')}
        />
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
          value={result.requiredWattage}
          unit={t('resultUnit')}
          status={result.status}
          recommendation={t('recommendationText', {
            wattage: result.recommendedWattage,
          })}
          formula={t('formula')}
          helpText={t('helpText')}
          min={0}
          max={result.recommendedWattage * 1.5}
          visual="gauge"
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
              categorySlug="heating"
              categoryLabel={tTabs('heater')}
            />
          )}
        </div>
      )}
    </div>
  );
}
