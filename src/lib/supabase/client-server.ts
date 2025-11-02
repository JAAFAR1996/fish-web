import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAnonKey, getSupabaseUrl } from '../env';
import { getBrowserSupabaseClient } from './client';

export function createClientSupabaseClient() {
  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}

// Optional re-export/alias to avoid duplication in client codebases
export { getBrowserSupabaseClient };
