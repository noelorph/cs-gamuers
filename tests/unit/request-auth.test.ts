// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const runtime = vi.hoisted(() => ({
  connection: vi.fn(),
  cookies: vi.fn(),
}));
vi.mock('next/server', () => ({ connection: runtime.connection }));
vi.mock('next/headers', () => ({
  cookies: runtime.cookies,
  headers: async () =>
    new Headers({ 'x-cs-proxy': 'synthetic-proxy-secret-32-characters', 'x-cs-ip': '192.0.2.2' }),
}));
vi.mock('@/config/env', () => ({
  getAppEnv: () => ({ supabaseUrl: 'https://example.supabase.co' }),
  getAdminEnv: () => ({ secretKey: 'sb_secret_synthetic' }),
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ rpc: async () => ({ data: 'admitted', error: null }) }),
}));
import { createRequestAuth } from '@/lib/supabase/auth';
afterEach(() => vi.restoreAllMocks());

test('request auth waits for the real-request boundary before reading SDK session cookies', async () => {
  let connected = false;
  let release!: () => void;
  runtime.connection.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        release = () => {
          connected = true;
          resolve();
        };
      })
  );
  runtime.cookies.mockImplementation(async () => {
    if (!connected) throw new Error('Session cookies read during prerender');
    return { getAll: () => [], set: () => {} };
  });
  const pending = createRequestAuth();
  // Attach rejection handling before yielding so a missing boundary fails cleanly.
  const outcome = pending.then(
    (auth) => auth.getSession(),
    (error: unknown) => error
  );
  await Promise.resolve();
  expect(runtime.cookies).not.toHaveBeenCalled();
  release();
  expect(await outcome).toEqual({ data: { session: null }, error: null });
});

test('staged sign-in leaves existing cookies untouched until explicitly accepted', async () => {
  runtime.connection.mockResolvedValue(undefined);
  vi.stubEnv('AUTH_PASSWORD_GATE_VERIFIED_PROJECT_REF', 'example');
  vi.stubEnv('LOCAL_PROXY_SECRET', 'synthetic-proxy-secret-32-characters');
  const existing = [{ name: 'unrelated', value: 'keep' }];
  const writes: { name: string; value: string }[] = [];
  runtime.cookies.mockResolvedValue({
    getAll: () => existing,
    set: (name: string, value: string) => writes.push({ name, value }),
  });
  const user = {
    id: 'synthetic',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  vi.stubGlobal('fetch', async () =>
    Response.json({
      access_token: `e30.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 3600, sub: user.id, role: 'authenticated' })).toString('base64url')}.signature`,
      refresh_token: 'synthetic-refresh',
      expires_in: 3600,
      token_type: 'bearer',
      user,
    })
  );
  const expired =
    'base64-' +
    Buffer.from(
      JSON.stringify({
        access_token: `e30.${Buffer.from(JSON.stringify({ exp: 1, sub: user.id, role: 'authenticated' })).toString('base64url')}.signature`,
        refresh_token: 'existing-refresh-must-not-rotate',
        expires_at: 1,
        expires_in: 3600,
        token_type: 'bearer',
        user,
      })
    ).toString('base64url');
  existing.push(
    { name: 'sb-example-auth-token.0', value: expired.slice(0, 200) },
    { name: 'sb-example-auth-token.1', value: expired.slice(200) }
  );
  const { createStagedAuth } = await import('@/lib/supabase/auth');
  const staged = await createStagedAuth();
  expect(await staged.auth.getSession()).toEqual({ data: { session: null }, error: null });
  const result = await staged.auth.signInWithPassword({
    email: 'synthetic@example.invalid',
    password: 'synthetic password',
  });
  expect(result.error).toBeNull();
  expect(writes).toEqual([]);
  staged.commit();
  expect(writes.some(({ name, value }) => name.includes('-auth-token') && value.length > 0)).toBe(
    true
  );
  expect(writes.some(({ name }) => name === 'unrelated')).toBe(false);
  expect(writes).toContainEqual({ name: 'sb-example-auth-token.1', value: '' });
  vi.unstubAllGlobals();
});
