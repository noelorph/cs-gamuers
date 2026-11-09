// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  rpc: vi.fn(),
  getSession: vi.fn(),
  adminOut: vi.fn(),
  commit: vi.fn(),
  clientToken: vi.fn(),
}));
vi.mock('@/lib/supabase/auth', () => ({
  AuthenticationThrottled: class extends Error {},
  createStagedAuth: async () => ({
    auth: { signInWithPassword: mocks.signIn },
    commit: mocks.commit,
  }),
  createRequestAuth: async () => ({
    signInWithPassword: mocks.signIn,
    signOut: mocks.signOut,
    getSession: mocks.getSession,
  }),
}));
vi.mock('@/lib/supabase/server', () => ({
  createRequestClient: async () => ({ rpc: mocks.rpc }),
  createUserClient: (token: string) => {
    mocks.clientToken(token);
    return { rpc: mocks.rpc };
  },
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ auth: { admin: { signOut: mocks.adminOut } } }),
}));
import { signIn, signOut } from '@/features/accounts/session';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.adminOut.mockResolvedValue({ error: null });
  mocks.rpc.mockResolvedValue({ data: [], error: null });
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
  expect(
    await signIn(
      { email: ' User@example.invalid ', password: 'unaltered password' },
      role === 'administrator' ? 'admin' : 'standard'
    )
  ).toEqual({ ok: true, destination: path });
});
test('missing email and incorrect password share generic feedback', async () => {
  mocks.signIn.mockResolvedValue({
    data: { session: null },
    error: { code: 'invalid_credentials', status: 400 },
  });
  for (const email of ['missing@example.invalid', 'existing@example.invalid'])
    expect(await signIn({ email, password: 'wrong' }, 'standard')).toEqual({
      ok: false,
      code: 'invalid_credentials',
    });
});
test('a private gateway configuration error is unavailable, not incorrect credentials', async () => {
  mocks.signIn.mockResolvedValue({
    data: { session: null },
    error: { status: 401, code: 'invalid_api_key' },
  });
  expect(
    await signIn({ email: 'existing@example.invalid', password: 'password' }, 'standard')
  ).toEqual({
    ok: false,
    code: 'unavailable',
  });
});
test('provider outage stays unavailable', async () => {
  mocks.signIn.mockRejectedValue(Error('network'));
  expect(
    await signIn({ email: 'existing@example.invalid', password: 'wrong' }, 'standard')
  ).toEqual({
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
    expect(
      await signIn({ email: 'existing@example.invalid', password: 'password' }, 'standard')
    ).toEqual({
      ok: true,
      destination: '/auth/status',
    });
  }
);
test('proof-only account cannot establish an application session', async () => {
  mocks.rpc.mockResolvedValue({ data: [], error: null });
  expect(
    await signIn({ email: 'existing@example.invalid', password: 'password' }, 'standard')
  ).toEqual({
    ok: false,
    code: 'unavailable',
  });
  expect(mocks.commit).not.toHaveBeenCalled();
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
  await expect(signOut()).resolves.toBe('/auth/sign-in');
  expect(mocks.adminOut).toHaveBeenCalledWith('captured', 'local');
});

test.each([
  ['administrator', 'standard', '/admin/sign-in'],
  ['student', 'admin', '/auth/sign-in'],
  ['faculty', 'admin', '/auth/sign-in'],
  ['program_head', 'admin', '/auth/sign-in'],
] as const)('%s cannot establish a session at %s sign-in', async (role, portal, destination) => {
  mocks.rpc.mockResolvedValue({
    data: [{ id: 'x', role, active: true, application_status: 'approved' }],
    error: null,
  });
  mocks.adminOut.mockResolvedValue({ error: null });
  expect(await signIn({ email: 'existing@example.invalid', password: 'password' }, portal)).toEqual(
    { ok: false, code: 'wrong_portal', destination }
  );
  expect(mocks.commit).not.toHaveBeenCalled();
  expect(mocks.clientToken).toHaveBeenCalledWith('token');
  expect(mocks.adminOut).toHaveBeenCalledWith('token', 'local');
  expect(mocks.signOut).not.toHaveBeenCalled();
});
test('canonical lookup failure discards the attempted session without accepting cookies', async () => {
  mocks.rpc.mockResolvedValue({ data: null, error: { code: 'unavailable' } });
  mocks.adminOut.mockResolvedValue({ error: null });
  expect(
    await signIn({ email: 'existing@example.invalid', password: 'password' }, 'standard')
  ).toEqual({ ok: false, code: 'unavailable' });
  expect(mocks.commit).not.toHaveBeenCalled();
  expect(mocks.adminOut).toHaveBeenCalledWith('token', 'local');
});

test.each(['standard', 'admin'] as const)(
  'deactivated accounts cannot establish sessions at %s sign-in',
  async (portal) => {
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null }).mockResolvedValueOnce({
      data: [{ active: false, application_status: 'approved' }],
      error: null,
    });
    mocks.adminOut.mockResolvedValue({ error: null });
    expect(
      await signIn({ email: 'existing@example.invalid', password: 'password' }, portal)
    ).toEqual({ ok: false, code: 'deactivated' });
    expect(mocks.commit).not.toHaveBeenCalled();
  }
);
test.each([
  ['administrator', '/admin/sign-in'],
  ['faculty', '/auth/sign-in'],
] as const)('%s sign-out returns its login portal', async (role, destination) => {
  mocks.getSession.mockResolvedValue({
    data: { session: { access_token: 'captured' } },
    error: null,
  });
  mocks.rpc.mockResolvedValue({
    data: [{ id: 'x', role, active: true, application_status: 'approved' }],
    error: null,
  });
  mocks.adminOut.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });
  expect(await signOut()).toBe(destination);
});

test.each(['returned', 'thrown'])(
  'failed attempted-session cleanup (%s) is unavailable',
  async (failure) => {
    mocks.rpc.mockResolvedValue({
      data: [{ id: 'x', role: 'administrator', active: true, application_status: 'approved' }],
      error: null,
    });
    if (failure === 'returned') mocks.adminOut.mockResolvedValue({ error: { status: 503 } });
    else mocks.adminOut.mockRejectedValue(Error('network'));
    expect(
      await signIn({ email: 'existing@example.invalid', password: 'password' }, 'standard')
    ).toEqual({ ok: false, code: 'unavailable' });
    expect(mocks.commit).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();
  }
);

test.each(['admin', 'standard', '/admin/sign-in', 'https://attacker.invalid', null])(
  'missing canonical actor uses only allowlisted return portal %s',
  async (portal) => {
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: 'captured' } },
      error: null,
    });
    mocks.signOut.mockResolvedValue({ error: null });
    expect(await signOut(portal)).toBe(portal === 'admin' ? '/admin/sign-in' : '/auth/sign-in');
    expect(mocks.adminOut).toHaveBeenCalledWith('captured', 'local');
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: 'local' });
  }
);
test.each([
  ['faculty', 'admin', '/auth/sign-in'],
  ['administrator', 'standard', '/admin/sign-in'],
])('canonical %s role overrides return hint %s', async (role, portal, destination) => {
  mocks.getSession.mockResolvedValue({
    data: { session: { access_token: 'captured' } },
    error: null,
  });
  mocks.rpc.mockResolvedValue({ data: [{ role }], error: null });
  mocks.signOut.mockResolvedValue({ error: null });
  expect(await signOut(portal)).toBe(destination);
});
