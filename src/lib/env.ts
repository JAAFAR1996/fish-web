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

export function getJWTSecret(): string {
  return validateEnv('JWT_SECRET', process.env.JWT_SECRET, true) || 
    'your-secret-key-change-in-production-minimum-32-chars';
}
