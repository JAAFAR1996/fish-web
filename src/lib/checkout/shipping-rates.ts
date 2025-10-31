import type { Locale, ShippingRate } from '@/types';

import { FREE_SHIPPING_THRESHOLD } from '@/lib/cart/constants';

import { GOVERNORATES } from '@/data/governorates';

import {
  DEFAULT_DELIVERY_DAYS,
  DEFAULT_SHIPPING_RATE,
} from './constants';

export const GOVERNORATE_SHIPPING_RATES: Record<string, ShippingRate> = {
  Baghdad: {
    governorate: 'Baghdad',
    base_rate: 5_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 2,
  },
  Basra: {
    governorate: 'Basra',
    base_rate: 10_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 4,
  },
  Nineveh: {
    governorate: 'Nineveh',
    base_rate: 8_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 3,
  },
  Erbil: {
    governorate: 'Erbil',
    base_rate: 8_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 3,
  },
  Sulaymaniyah: {
    governorate: 'Sulaymaniyah',
    base_rate: 10_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 4,
  },
  Dohuk: {
    governorate: 'Dohuk',
    base_rate: 10_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 4,
  },
  Anbar: {
    governorate: 'Anbar',
    base_rate: 12_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 5,
  },
  Diyala: {
    governorate: 'Diyala',
    base_rate: 8_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 3,
  },
  Saladin: {
    governorate: 'Saladin',
    base_rate: 8_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 3,
  },
  Kirkuk: {
    governorate: 'Kirkuk',
    base_rate: 8_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 3,
  },
  Najaf: {
    governorate: 'Najaf',
    base_rate: 8_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 3,
  },
  Karbala: {
    governorate: 'Karbala',
    base_rate: 8_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 3,
  },
  Wasit: {
    governorate: 'Wasit',
    base_rate: 10_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 4,
  },
  Maysan: {
    governorate: 'Maysan',
    base_rate: 12_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 5,
  },
  'Dhi Qar': {
    governorate: 'Dhi Qar',
    base_rate: 10_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 4,
  },
  Muthanna: {
    governorate: 'Muthanna',
    base_rate: 12_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 5,
  },
  Qadisiyyah: {
    governorate: 'Qadisiyyah',
    base_rate: 10_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 4,
  },
  Babil: {
    governorate: 'Babil',
    base_rate: 8_000,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: 3,
  },
};

function getDefaultShippingRate(governorate: string): ShippingRate {
  return {
    governorate,
    base_rate: DEFAULT_SHIPPING_RATE,
    free_shipping_threshold: FREE_SHIPPING_THRESHOLD,
    estimated_delivery_days: DEFAULT_DELIVERY_DAYS,
  };
}

function addBusinessDays(date: Date, businessDays: number) {
  const result = new Date(date);
  let daysToAdd = businessDays;

  while (daysToAdd > 0) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    // Treat Friday (5) and Saturday (6) as weekend days in Iraq.
    const isWeekend = day === 5 || day === 6;

    if (!isWeekend) {
      daysToAdd -= 1;
    }
  }

  return result;
}

export function calculateShippingCost(
  governorate: string,
  subtotal: number
): number {
  const rate = GOVERNORATE_SHIPPING_RATES[governorate];
  const threshold = rate?.free_shipping_threshold ?? FREE_SHIPPING_THRESHOLD;

  if (subtotal >= threshold) {
    return 0;
  }

  return rate?.base_rate ?? DEFAULT_SHIPPING_RATE;
}

export function getShippingRate(governorate: string): ShippingRate {
  return (
    GOVERNORATE_SHIPPING_RATES[governorate] ??
    getDefaultShippingRate(governorate)
  );
}

export function getEstimatedDeliveryDays(governorate: string): number {
  return (
    GOVERNORATE_SHIPPING_RATES[governorate]?.estimated_delivery_days ??
    DEFAULT_DELIVERY_DAYS
  );
}

export function formatDeliveryEstimate(
  governorate: string,
  locale: Locale
): string {
  const deliveryDays = getEstimatedDeliveryDays(governorate);
  const current = new Date();
  const deliveryDate = addBusinessDays(current, deliveryDays);

  const formatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-IQ' : 'en-US', {
    dateStyle: 'medium',
  });

  return formatter.format(deliveryDate);
}

export function getAllGovernorateRates(): ShippingRate[] {
  const rates = GOVERNORATES.map((governorate) =>
    getShippingRate(governorate)
  );

  return rates.sort((a, b) => a.governorate.localeCompare(b.governorate));
}
