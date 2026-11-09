// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  create: vi.fn(),
  getSession: vi.fn(),
  getUser: vi.fn(),
  cookies: vi.fn(),
  auth: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: async () => ({ getAll: mocks.cookies }) }));
vi.mock('@/lib/supabase/auth', () => ({
  createRequestAuth: mocks.auth,
}));
vi.mock('@/config/env', () => ({
  getAppEnv: () => ({ supabaseUrl: 'https://example.supabase.co' }),
  getAdminEnv: () => ({ secretKey: 'sb_secret_synthetic' }),
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.create }));
import { createRequestClient } from '@/lib/supabase/server';
import { requireActor } from '@/lib/access';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookies.mockReturnValue([{ name: 'sb-example-auth-token.0', value: 'synthetic' }]);
  mocks.auth.mockResolvedValue({ getSession: mocks.getSession, getUser: mocks.getUser });
  mocks.getSession.mockResolvedValue({
    data: { session: { access_token: 'verified-token' } },
    error: null,
  });
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'id' } }, error: null });
  mocks.create.mockImplementation(() => ({ rpc: mocks.rpc }));
});

describe('request account boundary', () => {
  it('refuses absent session cookies before requiring provider configuration', async () => {
    mocks.cookies.mockReturnValue([{ name: 'unrelated', value: 'keep' }]);
    mocks.auth.mockRejectedValue(new Error('Missing SUPABASE_URL'));
    await expect(createRequestClient()).rejects.toThrow('Authentication required');
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it('pins a verified token per request and refuses missing, expired or unverifiable sessions', async () => {
    const first = await createRequestClient();
    const second = await createRequestClient();
    expect(first).not.toBe(second);
    expect(await mocks.create.mock.calls[0][2].accessToken()).toBe('verified-token');
    for (const session of [
      { data: { session: null }, error: null },
      { data: { session: null }, error: {} },
    ]) {
      mocks.getSession.mockResolvedValue(session);
      await expect(createRequestClient()).rejects.toThrow('Authentication required');
    }
    mocks.getSession.mockResolvedValue({
      data: { session: { access_token: 'unverified' } },
      error: null,
    });
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: {} });
    await expect(createRequestClient()).rejects.toThrow('Authentication required');
    expect(mocks.create).toHaveBeenCalledTimes(2);
  });

  it('fails closed when the database actor check errors or returns no live session', async () => {
    for (const result of [
      { data: null, error: {} },
      { data: [], error: null },
    ]) {
      mocks.rpc.mockResolvedValue(result);
      await expect(requireActor()).rejects.toThrow('Authentication required');
    }
    expect(mocks.rpc).toHaveBeenCalledWith('current_actor');
  });

  it.each(['pending', 'needs_correction', 'rejected'])(
    'rejects an unapproved %s account even without a required role',
    async (application_status) => {
      mocks.rpc.mockResolvedValue({
        data: [{ id: 'id', role: 'faculty', application_status, active: true }],
        error: null,
      });
      await expect(requireActor()).rejects.toThrow('Access denied');
    }
  );

  it('returns the exact trusted Actor projection only after approval and activation', async () => {
    const actor = { id: 'id', role: 'faculty', application_status: 'approved', active: true };
    mocks.rpc.mockResolvedValue({
      data: [actor],
      error: null,
    });
    expect(await requireActor()).toEqual({ id: 'id', role: 'faculty' });
    expect(await requireActor('faculty')).toEqual({ id: 'id', role: 'faculty' });
    await expect(requireActor('administrator')).rejects.toThrow('Access denied');
    mocks.rpc.mockResolvedValue({ data: [{ ...actor, active: false }], error: null });
    await expect(requireActor()).rejects.toThrow('Authentication required');
  });
});
