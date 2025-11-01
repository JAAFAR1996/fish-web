import 'server-only';

import type { PostgrestError } from '@supabase/postgrest-js';

import { logWarn, normalizeError } from '@/lib/logger';

type RetryOptions = {
  attempts: number;
  timeoutMs: number;
  initialDelayMs: number;
  backoffFactor: number;
};

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  attempts: 3,
  timeoutMs: 10_000,
  initialDelayMs: 200,
  backoffFactor: 2,
};

class TimeoutError extends Error {
  constructor(operationName: string) {
    super(`Operation "${operationName}" timed out.`);
    this.name = 'TimeoutError';
  }
}

class SupabaseTransientError extends Error {
  public readonly cause: PostgrestError;

  constructor(operationName: string, cause: PostgrestError) {
    super(`Supabase transient error during "${operationName}": ${cause.message}`);
    this.name = 'SupabaseTransientError';
    this.cause = cause;
  }
}

function shouldRetryError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof TimeoutError) {
    return true;
  }

  if (error instanceof SupabaseTransientError) {
    return true;
  }

  if (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  const { errorMessage } = normalizeError(error);
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes('timeout') || normalized.includes('network') || normalized.includes('temporarily')) {
    return true;
  }

  return false;
}

async function withTimeout<T>(
  operationName: string,
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new TimeoutError(operationName));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    return result;
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

export async function runWithRetries<T>(
  operationName: string,
  handler: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const { attempts, timeoutMs, initialDelayMs, backoffFactor } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...options,
  };

  let attempt = 0;
  let delay = initialDelayMs;
  let lastError: unknown;

  while (attempt < attempts) {
    attempt += 1;
    try {
      return await withTimeout(operationName, handler(), timeoutMs);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !shouldRetryError(error)) {
        throw error;
      }

      const { errorMessage } = normalizeError(error);
      logWarn('Retrying transient operation failure', {
        operation: operationName,
        attempt,
        attempts,
        errorMessage,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= backoffFactor;
    }
  }

  throw lastError ?? new Error(`Operation "${operationName}" failed after ${attempts} attempts.`);
}

function shouldRetrySupabaseError(error: PostgrestError | null): boolean {
  if (!error) {
    return false;
  }

  // Type guard to check if error has a status property
  const hasStatus = (err: unknown): err is { status: unknown } => {
    return typeof err === 'object' && err !== null && 'status' in err;
  };

  const status = hasStatus(error) && typeof error.status === 'number'
    ? error.status
    : Number(error.code);

  if (Number.isFinite(status) && status >= 500) {
    return true;
  }

  const message = error.message?.toLowerCase() ?? '';
  return message.includes('timeout') || message.includes('connection') || message.includes('terminating connection');
}

export async function withSupabaseRetry<T>(
  operationName: string,
  handler: () => Promise<{ data: T; error: PostgrestError | null }>,
  options?: Partial<RetryOptions>
): Promise<{ data: T; error: PostgrestError | null }> {
  return runWithRetries(operationName, async () => {
    const result = await handler();
    if (shouldRetrySupabaseError(result.error)) {
      throw new SupabaseTransientError(operationName, result.error!);
    }
    return result;
  }, options);
}

export async function withResendRetry<T>(
  operationName: string,
  handler: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  return runWithRetries(operationName, handler, options);
}
