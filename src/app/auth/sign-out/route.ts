import { NextResponse } from 'next/server';
import { signOut } from '@/features/accounts/session';
import { assertMutationOrigin, assertBodySize } from '@/lib/request-security';
import { getAppEnv } from '@/config/env';
export async function POST(request: Request) {
  try {
    assertMutationOrigin(request);
  } catch {
    return new Response('Use the original application page.', { status: 403 });
  }
  try {
    await assertBodySize(request);
  } catch {
    return new Response('Request too large.', { status: 413 });
  }
  try {
    const destination = await signOut(new URL(request.url).searchParams.get('portal'));
    return NextResponse.redirect(new URL(destination, getAppEnv().appOrigin), 303);
  } catch {
    return new Response(
      'Sign out could not be completed. Return to the application and try again.',
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } }
    );
  }
}
