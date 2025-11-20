// server-only: these helpers expose privileged credentials and must never run in the browser.
import 'server-only';

import { validateEnv } from './env';

export function getR2AccountId(): string {
  return validateEnv('R2_ACCOUNT_ID', process.env.R2_ACCOUNT_ID, true);
}

export function getR2AccessKeyId(): string {
  return validateEnv('R2_ACCESS_KEY_ID', process.env.R2_ACCESS_KEY_ID, true);
}

export function getR2SecretAccessKey(): string {
  return validateEnv('R2_SECRET_ACCESS_KEY', process.env.R2_SECRET_ACCESS_KEY, true);
}
