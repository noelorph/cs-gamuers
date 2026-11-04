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
  headers: async () => new Headers(),
}));
vi.mock('@/config/env', () => ({
  getAppEnv: () => ({ supabaseUrl: 'https://example.supabase.co' }),
  getAdminEnv: () => ({ secretKey: 'sb_secret_synthetic' }),
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
