// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  rpc: vi.fn(),
  getSession: vi.fn(),
  adminOut: vi.fn(),
}));
vi.mock('@/lib/supabase/auth', () => ({
  AuthenticationThrottled: class extends Error {},
  createRequestAuth: async () => ({
    signInWithPassword: mocks.signIn,
    signOut: mocks.signOut,
    getSession: mocks.getSession,
  }),
}));
vi.mock('@/lib/supabase/server', () => ({ createRequestClient: async () => ({ rpc: mocks.rpc }) }));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ auth: { admin: { signOut: mocks.adminOut } } }),
}));
import { signIn, signOut } from '@/features/accounts/session';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.signIn.mockResolvedValue({ data: { session: { access_token: 'token' } }, error: null });
});
test.each([
  ['student', '/student'],
  ['faculty', '/faculty'],
  ['program_head', '/program-head'],
  ['administrator', '/admin'],
])('approved %s reaches only its destination', async (role, path) => {
  mocks.rpc.mockResolvedValue({
    data: [{ id: 'x', role, active: true, application_status: 'approved' }],
    error: null,
  });
  expect(await signIn({ email: ' User@example.invalid ', password: 'unaltered password' })).toEqual(
    { ok: true, destination: path }
  );
});
test('missing email and incorrect password share generic feedback', async () => {
  mocks.signIn.mockResolvedValue({
    data: { session: null },
    error: { code: 'invalid_credentials', status: 400 },
  });
  for (const email of ['missing@example.invalid', 'existing@example.invalid'])
    expect(await signIn({ email, password: 'wrong' })).toEqual({
      ok: false,
      code: 'invalid_credentials',
    });
});
test('a private gateway configuration error is unavailable, not incorrect credentials', async () => {
  mocks.signIn.mockResolvedValue({
    data: { session: null },
    error: { status: 401, code: 'invalid_api_key' },
  });
  expect(await signIn({ email: 'existing@example.invalid', password: 'password' })).toEqual({
    ok: false,
    code: 'unavailable',
  });
});
test('provider outage stays unavailable', async () => {
  mocks.signIn.mockRejectedValue(Error('network'));
  expect(await signIn({ email: 'existing@example.invalid', password: 'wrong' })).toEqual({
    ok: false,
    code: 'unavailable',
  });
});
test.each(['pending', 'needs_correction', 'rejected'])(
  '%s has status-only destination',
  async (application_status) => {
    mocks.rpc.mockResolvedValue({
      data: [{ id: 'x', role: 'faculty', active: true, application_status }],
      error: null,
    });
    expect(await signIn({ email: 'existing@example.invalid', password: 'password' })).toEqual({
      ok: true,
      destination: '/auth/status',
    });
  }
);
test('deactivated or proof-only account receives no role destination', async () => {
  mocks.rpc.mockResolvedValue({ data: [], error: null });
  expect(await signIn({ email: 'existing@example.invalid', password: 'password' })).toEqual({
    ok: true,
    destination: '/auth/status',
  });
});
test('sign-out refuses to report success or clear cookies if native removal fails', async () => {
  mocks.getSession.mockResolvedValue({
    data: { session: { access_token: 'captured' } },
    error: null,
  });
  mocks.adminOut.mockResolvedValue({ error: { status: 503 } });
  await expect(signOut()).rejects.toThrow();
  expect(mocks.signOut).not.toHaveBeenCalled();
  mocks.adminOut.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
  await expect(signOut()).resolves.toBeUndefined();
  expect(mocks.adminOut).toHaveBeenCalledWith('captured', 'local');
});
