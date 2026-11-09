// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ rpc: vi.fn(), read: vi.fn(), actor: vi.fn() }));
vi.mock('@/lib/access', () => ({ requireActor: mocks.actor }));
vi.mock('@/lib/supabase/server', () => ({
  createRequestClient: async () => ({
    rpc: mocks.rpc,
    from: () => ({ select: () => ({ eq: () => ({ eq: () => ({ maybeSingle: mocks.read }) }) }) }),
  }),
}));
import {
  updateCourseDraft,
  deleteCourseDraft,
  createCourseDraft,
} from '@/features/content/courses';
const id = '10000000-0000-4000-8000-000000000001';
const details = {
  title: '',
  description: '',
  primaryTopic: null,
  difficulty: null,
  outcomes: [],
  priorKnowledge: '',
  estimatedHours: null,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.actor.mockResolvedValue({ id: 'owner', role: 'faculty' });
  mocks.rpc.mockResolvedValue({ error: { message: 'private raw error' }, data: null });
});
test.each(['update', 'delete'])(
  'uncertain %s fetches current permitted version without replaying a mutation',
  async (operation) => {
    mocks.read.mockResolvedValue({
      data: {
        id,
        revision_id: 'revision',
        owner_id: 'owner',
        updated_at: '2026-11-04T00:00:00Z',
        version: 2,
        details,
      },
      error: null,
    });
    const result =
      operation === 'update'
        ? await updateCourseDraft(id, 1, details)
        : await deleteCourseDraft(id, 1);
    expect(result).toEqual({ ok: false, code: 'conflict' });
    expect(mocks.read).toHaveBeenCalledOnce();
    expect(mocks.rpc).toHaveBeenCalledOnce();
  }
);
test('missing after uncertain deletion is unavailable, never invented success', async () => {
  mocks.read.mockResolvedValue({ data: null, error: null });
  expect(await deleteCourseDraft(id, 1)).toEqual({ ok: false, code: 'unavailable' });
  expect(mocks.read).toHaveBeenCalledOnce();
});
test('unconfirmed update with unchanged current version stays unavailable', async () => {
  mocks.rpc.mockRejectedValue(new Error('network payload must stay private'));
  mocks.read.mockResolvedValue({
    data: {
      id,
      revision_id: 'revision',
      owner_id: 'owner',
      updated_at: '2026-11-04T00:00:00Z',
      version: 1,
      details,
    },
    error: null,
  });
  expect(await updateCourseDraft(id, 1, details)).toEqual({ ok: false, code: 'unavailable' });
  expect(mocks.read).toHaveBeenCalledOnce();
});
test('input and authorization failures never invoke a mutation or serialize errors', async () => {
  expect(await createCourseDraft(id, { ...details, title: 'x'.repeat(201) })).toMatchObject({
    ok: false,
    code: 'validation',
  });
  expect(await updateCourseDraft(id, NaN, details)).toEqual({ ok: false, code: 'validation' });
  mocks.actor.mockRejectedValue(new Error('Authentication required'));
  expect(await createCourseDraft(id, details)).toEqual({ ok: false, code: 'unauthenticated' });
  expect(mocks.rpc).not.toHaveBeenCalled();
});
