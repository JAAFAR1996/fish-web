import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseAnonKey, getSupabaseUrl } from '../env';

let browserClient: SupabaseClient | null = null;

export function createClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

export function getBrowserSupabaseClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient();
  }

  return browserClient;
}

export const createBrowserSupabaseClient = getBrowserSupabaseClient;
