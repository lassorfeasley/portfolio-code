import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { buildProjectSlugTypeMap } from '@/lib/domain/projects/service';

export const revalidate = 3600;
export const runtime = 'nodejs';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    // In local dev without env vars, return an empty map rather than 500
    return NextResponse.json({}, { status: 200 });
  }

  try {
    const supabase = supabaseServer();
    const map = await buildProjectSlugTypeMap(supabase);
    return NextResponse.json(map, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to build project map';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
