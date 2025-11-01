type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...context,
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
