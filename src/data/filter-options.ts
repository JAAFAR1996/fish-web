import type { FilterOption, ProductFilters } from '@/types';

export const FILTER_TYPES: FilterOption[] = [
  { value: 'hob', labelKey: 'plp.filters.type.hob' },
  { value: 'canister', labelKey: 'plp.filters.type.canister' },
  { value: 'sponge', labelKey: 'plp.filters.type.sponge' },
  { value: 'internal', labelKey: 'plp.filters.type.internal' },
];

export const TANK_SIZE_PRESETS = [
  { min: null, max: 50, labelKey: 'plp.filters.tankSize.upTo' },
  { min: 51, max: 100, labelKey: '51-100L' },
  { min: 101, max: 200, labelKey: '101-200L' },
  { min: 201, max: 300, labelKey: '201-300L' },
  { min: 301, max: null, labelKey: '301L+' },
];

export const FLOW_RATE_PRESETS = [
  { min: null, max: 500, labelKey: 'plp.filters.flowRate.from' },
  { min: 501, max: 1000, labelKey: '501-1000' },
  { min: 1001, max: 1500, labelKey: '1001-1500' },
  { min: 1501, max: null, labelKey: '1501+' },
];

export const DEFAULT_FILTERS: ProductFilters = {
  types: [],
  tankSizeMin: null,
  tankSizeMax: null,
  flowRateMin: null,
  flowRateMax: null,
  brands: [],
  categories: [],
  subcategories: [],
};

export function getFilterTypeOptions(): FilterOption[] {
  return FILTER_TYPES;
}

export function isFilterActive(filters: ProductFilters): boolean {
  return (
    filters.types.length > 0 ||
    filters.tankSizeMin !== null ||
    filters.tankSizeMax !== null ||
    filters.flowRateMin !== null ||
    filters.flowRateMax !== null ||
    filters.brands.length > 0 ||
    filters.categories.length > 0 ||
    filters.subcategories.length > 0
  );
}

export function getActiveFilterCount(filters: ProductFilters): number {
  let count = 0;
  if (filters.types.length > 0) count += filters.types.length;
  if (filters.tankSizeMin !== null || filters.tankSizeMax !== null) count += 1;
  if (filters.flowRateMin !== null || filters.flowRateMax !== null) count += 1;
  if (filters.brands.length > 0) count += filters.brands.length;
  if (filters.categories.length > 0) count += filters.categories.length;
  if (filters.subcategories.length > 0) count += filters.subcategories.length;
  return count;
}

export function resetFilters(): ProductFilters {
  return { ...DEFAULT_FILTERS };
}
