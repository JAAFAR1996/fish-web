function validateEnv<T extends string>(
  name: string,
  value: string | undefined,
  serverOnly = false
): T {
  if (!value) {
    throw new Error(
      `${name} environment variable is required${
        serverOnly ? ' on the server' : ''
      }`
    );
  }
  return value as T;
}

export function getSupabaseUrl(): string {
  return validateEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return validateEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseServiceRoleKey(): string {
  return validateEnv(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    true
  );
}

// For admin client
export function getSupabaseServerUrl(): string {
  return validateEnv('SUPABASE_URL', process.env.SUPABASE_URL, true);
}