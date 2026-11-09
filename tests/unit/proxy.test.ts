// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { unstable_getResponseFromNextConfig } from 'next/experimental/testing/server';
import nextConfig from '../../next.config';
vi.mock('server-only', () => ({}));
// The provider refresh is external; retain the actual response/cookie replacement path.
vi.mock('@/lib/supabase/auth', () => ({
  sessionCookieOptions: { httpOnly: true, secure: true, sameSite: 'lax', path: '/' },
  createCookieAuth: (cookies: { setAll: (values: unknown[]) => void }) => ({
    getUser: async () => {
      cookies.setAll([{ name: 'sb-test-auth-token', value: 'refreshed', options: {} }]);
    },
  }),
}));
import { proxy } from '@/proxy';
afterEach(() => vi.unstubAllEnvs());

test.each([
  ['/student', 'same-origin'],
  ['/faculty/courses', 'same-origin'],
  ['/program-head', 'same-origin'],
  ['/admin', 'same-origin'],
  ['/auth/sign-in', 'same-origin'],
  ['/auth/status', 'same-origin'],
  ['/auth/email', 'no-referrer'],
  ['/auth/email/confirm', 'no-referrer'],
  ['/auth/email-other', 'same-origin'],
])('response for %s keeps its referrer policy across cookie refresh', async (path, policy) => {
  const configured = await unstable_getResponseFromNextConfig({
    url: `https://demo.invalid${path}`,
    nextConfig,
  });
  expect(configured.headers.get('Referrer-Policy')).toBe(policy);
  expect(configured.headers.get('Cache-Control')).toBe('private, no-store');
  for (const refresh of [false, true]) {
    const response = await proxy(
      new NextRequest(`https://demo.invalid${path}`, {
        headers: refresh ? { cookie: 'sb-test-auth-token=old' } : {},
      })
    );
    expect(response.headers.get('Referrer-Policy')).toBe(policy);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    if (refresh) expect(response.cookies.get('sb-test-auth-token')?.value).toBe('refreshed');
  }
});

test('sign-out still requires an exact origin', async () => {
  vi.stubEnv('APP_ORIGIN', 'https://demo.invalid');
  for (const origin of [undefined, 'null', 'https://attacker.invalid', 'https://demo.invalid']) {
    const response = await proxy(
      new NextRequest('https://demo.invalid/auth/sign-out', {
        method: 'POST',
        headers: origin ? { origin } : {},
      })
    );
    expect(response.status).toBe(origin === 'https://demo.invalid' ? 200 : 403);
  }
});
