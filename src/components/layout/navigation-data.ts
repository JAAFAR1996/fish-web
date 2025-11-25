import type { IconName } from '@/components/ui';

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
  icon: IconName;
  image: string;
  accent: string;
  subcategories: string[];
};

export const CATEGORIES: readonly CategoryConfig[] = [
  {
    key: 'filters',
    icon: 'filter',
    image: '/images/categories/filters.svg',
    accent: 'from-aqua-500/20 via-cyan-500/15 to-blue-500/10',
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
    icon: 'activity',
    image: '/images/categories/air.svg',
    accent: 'from-sky-500/20 via-cyan-400/15 to-blue-400/10',
    subcategories: ['airPumps', 'airStones', 'tubing', 'valves', 'accessories'],
  },
  {
    key: 'heaters',
    icon: 'thermometer',
    image: '/images/categories/heaters.svg',
    accent: 'from-amber-500/20 via-orange-400/15 to-yellow-300/10',
    subcategories: ['submersible', 'external', 'controllers', 'thermometers'],
  },
  {
    key: 'plantLighting',
    icon: 'sun',
    image: '/images/categories/plant-lighting.svg',
    accent: 'from-emerald-500/20 via-lime-400/15 to-green-300/10',
    subcategories: ['led', 'fluorescent', 'timers', 'fixtures', 'bulbs'],
  },
  {
    key: 'hardscape',
    icon: 'grid',
    image: '/images/categories/hardscape.svg',
    accent: 'from-stone-500/20 via-stone-400/15 to-slate-300/10',
    subcategories: ['substrate', 'rocks', 'driftwood', 'decorations', 'backgrounds'],
  },
  {
    key: 'waterCare',
    icon: 'droplet',
    image: '/images/categories/water-care.svg',
    accent: 'from-blue-600/20 via-cyan-500/15 to-sky-300/10',
    subcategories: ['conditioners', 'treatments', 'clarifiers', 'bacteria', 'maintenance'],
  },
  {
    key: 'plantsFertilizers',
    icon: 'sparkles',
    image: '/images/categories/plants-fertilizers.svg',
    accent: 'from-emerald-500/20 via-teal-400/15 to-green-300/10',
    subcategories: ['livePlants', 'liquidFertilizers', 'substrateFertilizers', 'co2', 'tools'],
  },
  {
    key: 'tests',
    icon: 'beaker',
    image: '/images/categories/tests.svg',
    accent: 'from-indigo-500/20 via-blue-500/15 to-cyan-300/10',
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
