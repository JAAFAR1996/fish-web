const ARABIC_DIACRITICS_REGEX = /[\u0610-\u061A\u064B-\u065F\u06D6-\u06ED]/g;
const TATWEEL_REGEX = /\u0640/g;
const ARABIC_VARIANTS_REGEX = /[أإآٱا]/g;
const ALEF_MAQSURA_REGEX = /ى/g;
const TEH_MARBUTA_REGEX = /ة/g;

export function normalizeSearchText(value: string): string {
  if (!value) return '';

  return value
    .normalize('NFKD')
    .toLowerCase()
    .replace(ARABIC_DIACRITICS_REGEX, '')
    .replace(TATWEEL_REGEX, '')
    .replace(ARABIC_VARIANTS_REGEX, 'ا')
    .replace(ALEF_MAQSURA_REGEX, 'ي')
    .replace(TEH_MARBUTA_REGEX, 'ه')
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
