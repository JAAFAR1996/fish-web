// server-only

import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set');
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

export const FROM_EMAIL = process.env.FROM_EMAIL ?? 'orders@fishweb.iq';
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@fishweb.iq';
export const REPLY_TO_EMAIL = SUPPORT_EMAIL;

export function getFromEmail() {
  return FROM_EMAIL;
}
