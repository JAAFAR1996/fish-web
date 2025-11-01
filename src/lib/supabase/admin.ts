// server-only
import 'server-only';

/**
 * Admin Supabase client that bypasses Row Level Security.
 * Use only in trusted server-side contexts (Route Handlers, Server Actions).
 */
import { createClient } from '@supabase/supabase-js';

import { getSupabaseServerUrl, getSupabaseServiceRoleKey } from '../env.server';

if (typeof window !== 'undefined') {
  throw new Error('Supabase admin client must not be used in the browser');
}

export const adminClient = createClient(
  getSupabaseServerUrl(),
  getSupabaseServiceRoleKey(),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
