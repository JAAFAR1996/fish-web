export function validateEnv<T extends string>(
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
