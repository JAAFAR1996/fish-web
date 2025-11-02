'use client';

import { useTranslations } from 'next-intl';
import type { ProductFilters } from '@/types';
import { Button, Checkbox, Input } from '@/components/ui';
import { FILTER_TYPES, DEFAULT_FILTERS } from '@/data/filter-options';
import { getBrandOptions } from '@/data/brands';

export interface ProductFiltersProps {
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  onApply: () => void;
}

export function ProductFilters({ filters, onChange, onApply }: ProductFiltersProps) {
  const t = useTranslations('plp.filters');
  const brands = getBrandOptions();

  const handleTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked
      ? [...filters.types, type]
      : filters.types.filter((t) => t !== type);
    onChange({ ...filters, types: newTypes });
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    const newBrands = checked
      ? [...filters.brands, brand]
      : filters.brands.filter((b) => b !== brand);
    onChange({ ...filters, brands: newBrands });
  };

  const handleReset = () => {
    onChange(DEFAULT_FILTERS);
  };

  return (
    <div className="sticky top-20 h-fit space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-sand-900 dark:text-sand-100">
          {t('title')}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="text-sm"
        >
          {t('resetFilters')}
        </Button>
      </div>

      {/* Type Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-sand-900 dark:text-sand-100">
          {t('type.label')}
        </h3>
        <div className="space-y-2">
          {FILTER_TYPES.map((type) => (
            <Checkbox
              key={type.value}
              id={`type-${type.value}`}
              checked={filters.types.includes(type.value)}
              onCheckedChange={(checked) => handleTypeChange(type.value, checked)}
              label={t(type.labelKey.split('.').pop() as string)}
            />
          ))}
        </div>
      </div>

      {/* Tank Size Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-sand-900 dark:text-sand-100">
          {t('tankSize.label')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="tankSizeMin"
              className="block text-xs text-sand-600 dark:text-sand-400 mb-1"
            >
              {t('tankSize.from')}
            </label>
            <Input
              id="tankSizeMin"
              type="number"
              min="0"
              placeholder={t('tankSize.placeholder')}
              value={filters.tankSizeMin ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  tankSizeMin: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <div>
            <label
              htmlFor="tankSizeMax"
              className="block text-xs text-sand-600 dark:text-sand-400 mb-1"
            >
              {t('tankSize.to')}
            </label>
            <Input
              id="tankSizeMax"
              type="number"
              min="0"
              placeholder={t('tankSize.placeholder')}
              value={filters.tankSizeMax ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  tankSizeMax: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Flow Rate Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-sand-900 dark:text-sand-100">
          {t('flowRate.label')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="flowRateMin"
              className="block text-xs text-sand-600 dark:text-sand-400 mb-1"
            >
              {t('flowRate.from')}
            </label>
            <Input
              id="flowRateMin"
              type="number"
              min="0"
              placeholder={t('flowRate.placeholder')}
              value={filters.flowRateMin ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  flowRateMin: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
          <div>
            <label
              htmlFor="flowRateMax"
              className="block text-xs text-sand-600 dark:text-sand-400 mb-1"
            >
              {t('flowRate.to')}
            </label>
            <Input
              id="flowRateMax"
              type="number"
              min="0"
              placeholder={t('flowRate.placeholder')}
              value={filters.flowRateMax ?? ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  flowRateMax: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Brand Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-sand-900 dark:text-sand-100">
          {t('brand.label')}
        </h3>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {brands.map((brand) => (
            <Checkbox
              key={brand.name}
              id={`brand-${brand.name}`}
              checked={filters.brands.includes(brand.name)}
              onCheckedChange={(checked) => handleBrandChange(brand.name, checked)}
              label={brand.name}
            />
          ))}
        </div>
      </div>

      {/* Apply Button */}
      <Button
        variant="primary"
        size="md"
        onClick={onApply}
        className="w-full"
      >
        {t('applyFilters')}
      </Button>
    </div>
  );
}
