import type {
  CheckoutData,
  PaymentMethod,
  ShippingAddressSnapshot,
  ValidationResult,
} from '@/types';

import { isValidGovernorate } from '@/data/governorates';
import { validateEmail } from '@/lib/auth/validation';

const PHONE_REGEX_IQ = /^(?:\+?964|0)?7[0-9]{9}$/;
const COUPON_CODE_REGEX = /^[A-Z0-9]{4,20}$/;

function normalizeIraqPhone(phone?: string | null): string {
  if (!phone) return '';

  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return '';

  const withoutCountry = digits.startsWith('964') ? digits.slice(3) : digits;
  const trimmed = withoutCountry.startsWith('0')
    ? withoutCountry.slice(1)
    : withoutCountry;

  if (!trimmed.startsWith('7')) {
    return '';
  }

  const normalized = trimmed.slice(0, 10);
  return `+964${normalized}`;
}

function createValidationResult(errors: Record<string, string>): ValidationResult {
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateShippingInfo(
  address: Partial<ShippingAddressSnapshot>,
  guestEmail?: string | null,
  isGuest: boolean = false
): ValidationResult {
  const errors: Record<string, string> = {};

  const name = address.recipient_name?.trim() ?? '';
  const street = address.address_line1?.trim() ?? '';
  const city = address.city?.trim() ?? '';
  const governorate = address.governorate ?? '';

  if (!name) {
    errors.recipient_name = 'checkout.validation.recipientRequired';
  }
  if (!street) {
    errors.address_line1 = 'checkout.validation.streetRequired';
  }
  if (!city) {
    errors.city = 'checkout.validation.cityRequired';
  }
  if (!governorate || !isValidGovernorate(governorate)) {
    errors.governorate = 'checkout.validation.governorateRequired';
  }

  const normalizedPhone = normalizeIraqPhone(address.phone);
  if (!address.phone || address.phone.trim().length === 0) {
    errors.phone = 'auth.validation.phoneRequired';
  } else if (!normalizedPhone || !PHONE_REGEX_IQ.test(normalizedPhone)) {
    errors.phone = 'auth.validation.phoneInvalid';
  }

  if (isGuest) {
    const email = guestEmail ?? '';
    if (email.trim().length > 0) {
      const emailValidation = validateEmail(email);
      if (!emailValidation.valid) {
        errors.email =
          emailValidation.errors.email ?? 'checkout.validation.emailInvalid';
      }
    }
  }

  if (
    errors.recipient_name ||
    errors.address_line1 ||
    errors.city ||
    errors.governorate
  ) {
    errors.address = 'checkout.validation.addressRequired';
  }

  return createValidationResult(errors);
}

export function validatePaymentMethod(
  paymentMethod: PaymentMethod | null
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!paymentMethod) {
    errors.paymentMethod = 'checkout.validation.paymentRequired';
  }

  return createValidationResult(errors);
}

export function validateCheckoutData(
  data: CheckoutData & { guestEmail?: string | null },
  isGuest: boolean
): ValidationResult {
  const errors: Record<string, string> = {};

  const shippingResult = validateShippingInfo(
    data.shippingAddress,
    data.guestEmail,
    isGuest
  );
  if (!shippingResult.valid) {
    Object.assign(errors, shippingResult.errors);
  }

  const paymentResult = validatePaymentMethod(data.paymentMethod);
  if (!paymentResult.valid) {
    Object.assign(errors, paymentResult.errors);
  }

  return createValidationResult(errors);
}

export function validateCouponCode(code: string): ValidationResult {
  const errors: Record<string, string> = {};

  if (!code || code.trim().length === 0) {
    errors.coupon = 'checkout.coupon.invalidCode';
  } else if (!COUPON_CODE_REGEX.test(code.trim().toUpperCase())) {
    errors.coupon = 'checkout.coupon.invalidCode';
  }

  return createValidationResult(errors);
}
