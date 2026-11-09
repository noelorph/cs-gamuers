// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/config/env', () => ({
  getAppEnv: () => ({ supabaseUrl: 'https://example.supabase.co' }),
  getAdminEnv: () => ({ secretKey: 'sb_secret_synthetic' }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: async () => ({ data: 'admitted', error: null }) }),
}));
import { createCookieAuth } from '@/lib/supabase/auth';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const user = {
  id: 'synthetic',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'synthetic@example.invalid',
  app_metadata: {},
  user_metadata: {},
  created_at: new Date().toISOString(),
};
const token = (expiry: number) =>
  `e30.${Buffer.from(JSON.stringify({ exp: expiry, sub: user.id, role: 'authenticated' })).toString('base64url')}.signature`;
test.each([true, false])(
  'expired cookie refresh succeeds=%s without permitting service-authority fallback',
  async (success) => {
    vi.stubEnv('AUTH_PASSWORD_GATE_VERIFIED_PROJECT_REF', 'example');
    vi.stubEnv('LOCAL_PROXY_SECRET', 'synthetic-proxy-secret-32-characters');
    const now = Math.floor(Date.now() / 1000);
    const expired = {
      access_token: token(now - 60),
      refresh_token: 'old-refresh',
      expires_at: now - 60,
      expires_in: 3600,
      token_type: 'bearer',
      user,
    };
    const next = {
      ...expired,
      access_token: token(now + 3600),
      refresh_token: 'new-refresh',
      expires_at: now + 3600,
    };
    const outbound: string[] = [];
    vi.stubGlobal('fetch', async (input: string | URL | Request, init?: RequestInit) => {
      const request = new Request(input, init);
      outbound.push(new URL(request.url).pathname);
      if (request.url.includes('/token'))
        return Response.json(
          success
            ? next
            : { message: 'Invalid refresh token', error_code: 'refresh_token_not_found' },
          { status: success ? 200 : 400 }
        );
      return Response.json(user);
    });
    let values = [
      {
        name: 'sb-example-auth-token',
        value: 'base64-' + Buffer.from(JSON.stringify(expired)).toString('base64url'),
      },
    ];
    const writes: unknown[] = [];
    const auth = createCookieAuth(
      {
        getAll: () => values,
        setAll: (cookies) => {
          writes.push(...cookies);
          values = cookies.map(({ name, value }) => ({ name, value }));
        },
      },
      new Headers({ 'x-cs-proxy': 'synthetic-proxy-secret-32-characters', 'x-cs-ip': '192.0.2.2' })
    );
    const result = await auth.getUser();
    expect(outbound).toContain('/auth/v1/token');
    expect(outbound.every((path) => path.startsWith('/auth/v1/'))).toBe(true);
    if (success) {
      expect(result.error).toBeNull();
      expect(writes.length).toBeGreaterThan(0);
      expect(JSON.stringify(writes)).toContain('httpOnly');
    } else {
      expect(result.data.user).toBeNull();
      expect(result.error).toBeTruthy();
    }
  }
);
