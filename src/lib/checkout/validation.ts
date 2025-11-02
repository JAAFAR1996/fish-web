import type {
  CheckoutData,
  PaymentMethod,
  ShippingAddressSnapshot,
  ValidationResult,
} from '@/types';

import { isValidGovernorate } from '@/data/governorates';
import { validateEmail } from '@/lib/auth/validation';

const PHONE_REGEX_IQ = /^\+964[0-9]{10}$/;
const COUPON_CODE_REGEX = /^[A-Z0-9]{4,20}$/;

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

  if (
    !address.recipient_name ||
    address.recipient_name.trim().length === 0 ||
    !address.address_line1 ||
    address.address_line1.trim().length === 0 ||
    !address.city ||
    address.city.trim().length === 0 ||
    !address.governorate ||
    !isValidGovernorate(address.governorate)
  ) {
    errors.address = 'checkout.validation.addressRequired';
  }

  if (!address.phone || address.phone.trim().length === 0) {
    errors.phone = 'auth.validation.phoneRequired';
  } else if (!PHONE_REGEX_IQ.test(address.phone.trim())) {
    errors.phone = 'auth.validation.phoneInvalid';
  }

  if (isGuest) {
    const email = guestEmail ?? '';
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      errors.email =
        emailValidation.errors.email ?? 'checkout.validation.emailInvalid';
    }
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
