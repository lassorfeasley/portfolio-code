import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/auth/admin';
import { supabaseServiceRole } from '@/lib/supabase/admin';
import { updateHeroContent } from '@/lib/domain/hero-content/service';
import { revalidatePublicSite } from '@/lib/revalidate';

export async function PUT(request: Request) {
  try {
    await requireAdminSession();
    const body = await request.json();
    
    const adminClient = supabaseServiceRole();
    const result = await updateHeroContent(adminClient, body.id, {
      windowTitle: body.windowTitle,
      heroText: body.heroText,
      heroImageUrl: body.heroImageUrl,
      footerLinkText: body.footerLinkText,
      footerLinkHref: body.footerLinkHref,
    });

    revalidatePublicSite();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating hero content:', error);
    return NextResponse.json(
      { error: 'Failed to update hero content' },
      { status: 500 }
    );
  }
}

