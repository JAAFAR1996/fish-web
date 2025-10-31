import type { ValidationResult } from '@/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX_IQ = /^\+964[0-9]{10}$/;
const OTP_REGEX = /^\d{6}$/;

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { valid: false, errors: { email: 'auth.validation.emailRequired' } };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, errors: { email: 'auth.validation.emailInvalid' } };
  }

  return { valid: true, errors: {} };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length === 0) {
    return { valid: false, errors: { password: 'auth.validation.passwordRequired' } };
  }

  if (password.length < 8) {
    return { valid: false, errors: { password: 'auth.validation.passwordMin' } };
  }

  return { valid: true, errors: {} };
}

export function validateSignup(data: {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.fullName || data.fullName.trim().length === 0) {
    errors.fullName = 'auth.validation.fullNameRequired';
  }

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) {
    Object.assign(errors, emailResult.errors);
  }

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid) {
    Object.assign(errors, passwordResult.errors);
  }

  if (!data.confirmPassword || data.confirmPassword.length === 0) {
    errors.confirmPassword = 'auth.validation.passwordRequired';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'auth.validation.passwordMismatch';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSignin(data: { email: string; password: string }): ValidationResult {
  const errors: Record<string, string> = {};

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid) {
    Object.assign(errors, emailResult.errors);
  }

  if (!data.password || data.password.length === 0) {
    errors.password = 'auth.validation.passwordRequired';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, errors: { phone: 'auth.validation.phoneRequired' } };
  }

  if (!PHONE_REGEX_IQ.test(phone.trim())) {
    return { valid: false, errors: { phone: 'auth.validation.phoneInvalid' } };
  }

  return { valid: true, errors: {} };
}

export function validateOtp(otp: string): ValidationResult {
  if (!otp || otp.trim().length === 0) {
    return { valid: false, errors: { otp: 'auth.validation.otpRequired' } };
  }

  if (!OTP_REGEX.test(otp.trim())) {
    return { valid: false, errors: { otp: 'auth.validation.otpInvalid' } };
  }

  return { valid: true, errors: {} };
}

export function isValidationError(result: ValidationResult) {
  return !result.valid;
}
