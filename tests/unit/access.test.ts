// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), create: vi.fn(), getAll: vi.fn(), set: vi.fn() }));
vi.mock('next/headers', () => ({
  cookies: async () => ({ getAll: mocks.getAll, set: mocks.set }),
}));
vi.mock('@/config/env', () => ({
  getAppEnv: () => ({ supabaseUrl: 'https://example.supabase.co', publishableKey: 'example' }),
}));
vi.mock('@supabase/ssr', () => ({ createServerClient: mocks.create }));
import { createRequestClient } from '@/lib/supabase/server';
import { requireActor } from '@/lib/access';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.create.mockImplementation(() => ({ rpc: mocks.rpc }));
});

describe('request account boundary', () => {
  it('creates a separate client with secure server-only cookie round trips', async () => {
    const first = await createRequestClient();
    const second = await createRequestClient();
    expect(first).not.toBe(second);
    const options = mocks.create.mock.calls[0][2];
    expect(options.cookieOptions).toMatchObject({
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    mocks.getAll.mockReturnValue([{ name: 'a', value: 'b' }]);
    expect(options.cookies.getAll()).toEqual([{ name: 'a', value: 'b' }]);
    options.cookies.setAll([{ name: 'a', value: 'c', options: { maxAge: 100 } }]);
    expect(mocks.set).toHaveBeenCalledWith(
      'a',
      'c',
      expect.objectContaining({ secure: true, httpOnly: true, sameSite: 'lax', maxAge: 100 })
    );
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
