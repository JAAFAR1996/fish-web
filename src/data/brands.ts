import type { BrandOption } from '@/types';

export const BRANDS: BrandOption[] = [
  { name: 'AquaClear' },
  { name: 'Fluval' },
  { name: 'EHEIM' },
  { name: 'Hikari' },
  { name: 'Aqueon' },
  { name: 'Penn-Plax' },
  { name: 'Marina' },
  { name: 'Tetra' },
  { name: 'Aquatop' },
  { name: 'Seachem' },
  { name: 'Aquael' },
  { name: 'JBL' },
  { name: 'Hydor' },
  { name: 'Oase' },
  { name: 'Hygger' },
  { name: 'Sobo' },
  { name: 'SunSun' },
  { name: 'Jebao' },
  { name: 'NICREW' },
];

export function getBrandOptions(): BrandOption[] {
  return BRANDS;
}

export function getAllBrandNames(): string[] {
  return BRANDS.map((b) => b.name);
}

export function getBrandByName(name: string): BrandOption | undefined {
  return BRANDS.find((b) => b.name === name);
}
