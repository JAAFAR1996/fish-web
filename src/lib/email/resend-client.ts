import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error('RESEND_API_KEY is not set');
}

export const resend = new Resend(apiKey);

export const FROM_EMAIL = process.env.FROM_EMAIL ?? 'orders@fishweb.iq';
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@fishweb.iq';
export const REPLY_TO_EMAIL = SUPPORT_EMAIL;

export function getFromEmail() {
  return FROM_EMAIL;
}
