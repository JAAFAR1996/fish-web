import 'server-only';

import { headers } from 'next/headers';

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

type HeaderSource = {
  get: (name: string) => string | null | undefined;
};

const REQUEST_ID_CANDIDATES = [
  'x-request-id',
  'x-correlation-id',
  'x-vercel-id',
  'x-amzn-trace-id',
  'x-requestid',
];

function resolveHeaders(): HeaderSource | null {
  try {
    return headers();
  } catch {
    return null;
  }
}

export function resolveRequestId(source?: HeaderSource | null): string | null {
  const headerSource = source ?? resolveHeaders();
  if (!headerSource) {
    return null;
  }

  for (const key of REQUEST_ID_CANDIDATES) {
    const value = headerSource.get(key);
    if (value) {
      return value;
    }
  }

  return null;
}

function withRequestContext(context?: LogContext): LogContext | undefined {
  const existingRequestId = context?.requestId;
  if (existingRequestId) {
    return context;
  }

  const requestId = resolveRequestId();
  if (!requestId) {
    return context;
  }

  return {
    ...(context ?? {}),
    requestId,
  };
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const enrichedContext = withRequestContext(context);

  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...enrichedContext,
  };

  if (level === 'error') {
    console.error(entry);
    return;
  }

  if (level === 'warn') {
    console.warn(entry);
    return;
  }

  console.log(entry);
}

export function logError(message: string, context?: LogContext) {
  log('error', message, context);
}

export function logWarn(message: string, context?: LogContext) {
  log('warn', message, context);
}

export function logInfo(message: string, context?: LogContext) {
  log('info', message, context);
}

export function normalizeError(
  error: unknown
): { errorMessage: string; errorStack?: string } {
  if (error instanceof Error) {
    return {
      errorMessage: error.message,
      errorStack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return {
      errorMessage: error,
    };
  }

  return {
    errorMessage: 'Unknown error',
  };
}
