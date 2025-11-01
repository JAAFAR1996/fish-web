import { REFERRAL_CODE_LENGTH, REFERRAL_COOKIE_NAME, REFERRAL_COOKIE_EXPIRY_DAYS } from './constants';

/**
 * Generate a unique referral code (8 characters, alphanumeric uppercase)
 */
export function generateReferralCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Set referral cookie (client-side function)
 */
export function setReferralCookie(referralCode: string): void {
  if (typeof document === 'undefined') return;

  const expiryDays = REFERRAL_COOKIE_EXPIRY_DAYS;
  const maxAge = expiryDays * 24 * 60 * 60; // Convert to seconds

  document.cookie = `${REFERRAL_COOKIE_NAME}=${referralCode}; max-age=${maxAge}; path=/; SameSite=Lax`;
}

/**
 * Get referral cookie (client-side function)
 */
export function getReferralCookie(): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === REFERRAL_COOKIE_NAME) {
      return value;
    }
  }

  return null;
}
