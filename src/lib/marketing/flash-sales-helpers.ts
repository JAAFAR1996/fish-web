import type { FlashSale, Locale } from '@/types';

export type CountdownTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
};

export function isFlashSaleActive(flashSale: FlashSale): boolean {
  if (!flashSale.is_active) return false;

  const now = new Date();
  const startsAt = new Date(flashSale.starts_at);
  const endsAt = new Date(flashSale.ends_at);

  return startsAt <= now && endsAt > now;
}

export function calculateTimeRemaining(endsAt: string): CountdownTime {
  const now = Date.now();
  const endTime = new Date(endsAt).getTime();
  const totalMs = Math.max(0, endTime - now);

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, totalMs };
}

export function formatCountdown(
  timeRemaining: { days: number; hours: number; minutes: number; seconds: number },
  locale: Locale
): string {
  const { days, hours, minutes, seconds } = timeRemaining;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
