export type CategoryKey =
  | 'filters'
  | 'air'
  | 'heaters'
  | 'plantLighting'
  | 'hardscape'
  | 'waterCare'
  | 'plantsFertilizers'
  | 'tests';

type CategoryConfig = {
  key: CategoryKey;
  subcategories: string[];
};

export const CATEGORIES: readonly CategoryConfig[] = [
  {
    key: 'filters',
    subcategories: [
      'hob',
      'canister',
      'sponge',
      'internal',
      'media',
      'accessories',
    ],
  },
  {
    key: 'air',
    subcategories: ['airPumps', 'airStones', 'tubing', 'valves', 'accessories'],
  },
  {
    key: 'heaters',
    subcategories: ['submersible', 'external', 'controllers', 'thermometers'],
  },
  {
    key: 'plantLighting',
    subcategories: ['led', 'fluorescent', 'timers', 'fixtures', 'bulbs'],
  },
  {
    key: 'hardscape',
    subcategories: ['substrate', 'rocks', 'driftwood', 'decorations', 'backgrounds'],
  },
  {
    key: 'waterCare',
    subcategories: ['conditioners', 'treatments', 'clarifiers', 'bacteria', 'maintenance'],
  },
  {
    key: 'plantsFertilizers',
    subcategories: ['livePlants', 'liquidFertilizers', 'substrateFertilizers', 'co2', 'tools'],
  },
  {
    key: 'tests',
    subcategories: [
      'waterTests',
      'phTests',
      'ammoniaTests',
      'nitriteTests',
      'nitrateTests',
      'multiTests',
    ],
  },
] as const;

export type CategorySubcategoryMap = typeof CATEGORIES[number]['subcategories'][number];
