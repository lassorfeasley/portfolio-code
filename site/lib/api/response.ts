import { NextResponse } from 'next/server';
import { ApiError } from '@/lib/api/errors';
import { logError, logWarning } from '@/lib/utils/logger';

type JsonValue = Record<string, unknown>;

export function json(data: JsonValue, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    logWarning('Handled API error', {
      error,
      context: { status: error.status, details: error.details ?? null },
    });
    return NextResponse.json({ error: error.message, details: error.details ?? null }, { status: error.status });
  }
  logError('Unhandled API error', {
    error: error instanceof Error ? error : new Error('Unknown error'),
    context: { rawError: error },
  });
  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
}



