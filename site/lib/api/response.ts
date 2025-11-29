import { NextResponse } from 'next/server';
import { ApiError } from '@/lib/api/errors';

type JsonValue = Record<string, unknown>;

export function json(data: JsonValue, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message, details: error.details ?? null }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
}


