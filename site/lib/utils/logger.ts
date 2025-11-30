type LogLevel = 'error' | 'warn' | 'info' | 'debug';

type LogContext = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const isProduction = process.env.NODE_ENV === 'production';
const CURRENT_LEVEL: LogLevel = isProduction ? 'warn' : 'debug';

type LogOptions = {
  error?: Error | null;
  context?: LogContext;
};

function shouldLog(level: LogLevel) {
  return LEVEL_ORDER[level] <= LEVEL_ORDER[CURRENT_LEVEL];
}

function formatPayload(level: LogLevel, message: string, options: LogOptions) {
  return {
    level,
    message,
    context: options.context ?? null,
    error: options.error
      ? {
          name: options.error.name,
          message: options.error.message,
          stack: options.error.stack,
        }
      : null,
    timestamp: new Date().toISOString(),
  };
}

function emit(level: LogLevel, message: string, options: LogOptions = {}) {
  if (!shouldLog(level)) return;

  const payload = formatPayload(level, message, options);
  const args: unknown[] = [
    `[${payload.timestamp}] [${payload.level.toUpperCase()}] ${payload.message}`,
  ];

  if (payload.context) {
    args.push(payload.context);
  }

  if (options.error) {
    args.push(options.error);
  }

  const consoleMethod =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : level === 'info'
          ? console.info
          : console.debug;

  consoleMethod(...args);

  /**
   * Placeholder for production logging provider (e.g., Sentry).
   * Example:
   * if (level === 'error' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
   *   Sentry.captureException(options.error ?? new Error(message), { extra: payload.context });
   * }
   */
}

export function logError(message: string, options: LogOptions = {}) {
  emit('error', message, options);
}

export function logWarning(message: string, options: LogOptions = {}) {
  emit('warn', message, options);
}

export function logInfo(message: string, options: LogOptions = {}) {
  emit('info', message, options);
}

export function logDebug(message: string, options: LogOptions = {}) {
  emit('debug', message, options);
}
