import { NextResponse, type NextRequest } from 'next/server';
import { assertMutationOrigin, assertBodySize } from '@/lib/request-security';
import { createCookieAuth, sessionCookieOptions } from '@/lib/supabase/auth';
export async function proxy(request: NextRequest) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    try {
      assertMutationOrigin(request);
    } catch {
      return new NextResponse('Use the original application page.', { status: 403 });
    }
    try {
      await assertBodySize(request);
    } catch {
      return new NextResponse('Request too large.', { status: 413 });
    }
  }
  let response = NextResponse.next({ request });
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  if (request.cookies.getAll().some(({ name }) => name.includes('-auth-token'))) {
    try {
      const auth = createCookieAuth(
        {
          getAll: () => request.cookies.getAll(),
          setAll: (values) => {
            for (const { name, value } of values) request.cookies.set(name, value);
            response = NextResponse.next({ request });
            for (const { name, value, options } of values)
              response.cookies.set(name, value, { ...options, ...sessionCookieOptions });
            response.headers.set('Cache-Control', 'private, no-store');
            response.headers.set('Referrer-Policy', 'no-referrer');
          },
        },
        request.headers
      );
      await auth.getUser();
    } catch {
      /* Each protected read independently refuses an unverified session. */
    }
  }
  return response;
}
export const config = {
  matcher: [
    '/auth/:path*',
    '/student/:path*',
    '/faculty/:path*',
    '/program-head/:path*',
    '/admin/:path*',
  ],
};
