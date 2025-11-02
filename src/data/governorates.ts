export const GOVERNORATES = [
  'Baghdad',
  'Basra',
  'Nineveh',
  'Erbil',
  'Sulaymaniyah',
  'Dohuk',
  'Anbar',
  'Diyala',
  'Saladin',
  'Kirkuk',
  'Najaf',
  'Karbala',
  'Wasit',
  'Maysan',
  'Dhi Qar',
  'Muthanna',
  'Qadisiyyah',
  'Babil',
] as const;

export type Governorate = (typeof GOVERNORATES)[number];

export function isValidGovernorate(value: string): value is Governorate {
  return GOVERNORATES.includes(value as Governorate);
}

export function getGovernorateOptions() {
  return GOVERNORATES.map((governorate) => ({
    value: governorate,
    label: governorate,
  }));
}
