// server-only: these helpers expose privileged credentials and must never run in the browser.
import 'server-only';

import { validateEnv } from './env';

export function getSupabaseServiceRoleKey(): string {
  return validateEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    true
  );
}

export function getSupabaseServerUrl(): string {
  return validateEnv('SUPABASE_URL', process.env.SUPABASE_URL, true);
}
