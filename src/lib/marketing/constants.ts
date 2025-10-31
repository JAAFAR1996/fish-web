// Marketing feature constants (Phase 16)

// Loyalty Points Configuration
export const POINTS_PER_IQD = 1; // Earn 1 point per 1000 IQD spent (divide order total by 1000)
export const POINTS_REDEMPTION_RATE = 50; // 1 point = 50 IQD discount (100 points = 5000 IQD)
export const MIN_POINTS_REDEMPTION = 100; // Minimum points required to redeem
export const MAX_POINTS_REDEMPTION_PERCENTAGE = 50; // Cannot use points for more than 50% of order total
export const REFERRAL_REWARD_POINTS = 500; // Points awarded to referrer when referee makes first purchase
export const REFEREE_REWARD_POINTS = 200; // Points awarded to referee on signup

// Flash Sales Configuration
export const FLASH_SALE_BADGE_COLOR = 'coral-500';
export const FLASH_SALE_BADGE_VARIANT = 'destructive' as const;
export const COUNTDOWN_UPDATE_INTERVAL = 1000; // Update countdown every 1 second (milliseconds)

// Bundles Configuration
export const BUNDLE_BADGE_COLOR = 'green-500';
export const BUNDLE_BADGE_VARIANT = 'success' as const;
export const MIN_BUNDLE_PRODUCTS = 2; // Minimum products in a bundle
export const MAX_BUNDLE_PRODUCTS = 5; // Maximum products in a bundle

// Referrals Configuration
export const REFERRAL_CODE_LENGTH = 8; // Characters in referral code (alphanumeric uppercase)
export const REFERRAL_COOKIE_NAME = 'fish-web-referral';
export const REFERRAL_COOKIE_EXPIRY_DAYS = 30; // How long referral attribution lasts

// Newsletter Configuration
export const NEWSLETTER_WELCOME_DELAY = 0; // Send welcome email immediately (milliseconds)
