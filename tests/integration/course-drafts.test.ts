// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, test, vi } from 'vitest';
import {
  admin,
  cleanFixtures,
  createFixture,
  harness,
  runId,
  signIn,
  testProjectRef,
} from './helpers/fixtures';
import type { SupabaseClient } from '@supabase/supabase-js';
vi.mock('server-only', () => ({}));
let requestClient: SupabaseClient;
vi.mock('@/lib/supabase/server', () => ({ createRequestClient: async () => requestClient }));
const details = {
  title: '',
  description: '',
  primaryTopic: null,
  difficulty: null,
  outcomes: [],
  priorKnowledge: '',
  estimatedHours: null,
};
const actors: Record<string, { id: string; client: SupabaseClient }> = {};
async function courseHarness(action: string, args: Record<string, unknown> = {}) {
  const result = await admin.rpc('test_course_fixture', {
    action,
    run_id: runId,
    args: { project_ref: testProjectRef, ...args },
  });
  if (result.error) throw new Error(`Course fixture ${action} failed (${result.error.code})`);
  return result.data;
}
afterAll(cleanFixtures, 30000);
beforeAll(async () => {
  for (const [label, role] of [
    ['a', 'faculty'],
    ['b', 'faculty'],
    ['student', 'student'],
    ['head', 'program_head'],
    ['admin', 'administrator'],
  ]) {
    const fixture = await createFixture(role);
    await harness('state', { account_id: fixture.id, status: 'approved' });
    actors[label] = { id: fixture.id, client: (await signIn(fixture)).client };
  }
}, 30000);
async function create(client = actors.a.client, id = randomUUID()) {
  const result = await client.rpc('create_course_draft', { course_id: id, details });
  expect(result.error).toBeNull();
  expect(result.data).toMatchObject({ ok: true, value: { id, version: 1, details } });
  return result.data.value;
}
test('ordinary Faculty persists CRUD and the server feature operations use the same user authority', async () => {
  const {
    createCourseDraft,
    getOwnCourseDraft,
    listOwnCourseDrafts,
    updateCourseDraft,
    deleteCourseDraft,
  } = await import('@/features/content/courses');
  requestClient = actors.a.client;
  const id = randomUUID();
  expect(await createCourseDraft(id, details)).toMatchObject({
    ok: true,
    value: { id, ownerId: actors.a.id, version: 1, details },
  });
  expect(await getOwnCourseDraft(id)).toMatchObject({ ok: true, value: { id } });
  const list = await listOwnCourseDrafts();
  expect(list.ok && list.value.some((d) => d.id === id)).toBe(true);
  expect(await updateCourseDraft(id, 1, { ...details, title: 'Saved' })).toMatchObject({
    ok: true,
    value: { version: 2, details: { title: 'Saved' } },
  });
  expect(await deleteCourseDraft(id, 1)).toEqual({ ok: false, code: 'conflict' });
  expect(await deleteCourseDraft(id, 2)).toEqual({ ok: true, value: null });
  expect(await deleteCourseDraft(id, 2)).toEqual({ ok: false, code: 'unavailable' });
  expect(await getOwnCourseDraft(id)).toEqual({ ok: false, code: 'unavailable' });
});
test('RLS allows owner and Program Head oversight only; direct invariant-bearing writes are denied for every role', async () => {
  const draft = await create();
  expect(draft.ownerId).toBe(actors.a.id);
  for (const [label, { client }] of Object.entries(actors)) {
    const reads = await Promise.all([
      client.from('courses').select('id').eq('id', draft.id),
      client.from('course_revisions').select('id').eq('course_id', draft.id),
      client.from('course_drafts').select('id').eq('id', draft.id),
    ]);
    for (const read of reads) {
      expect(read.error).toBeNull();
      expect(read.data).toHaveLength(['a', 'head'].includes(label) ? 1 : 0);
    }
    for (const table of ['courses', 'course_revisions']) {
      expect(
        (
          await client.from(table).insert(
            table === 'courses'
              ? { id: randomUUID(), owner_id: actors.a.id }
              : {
                  course_id: draft.id,
                  title: '',
                  description: '',
                  outcomes: [],
                  prior_knowledge: '',
                }
          )
        ).error?.code
      ).toBe('42501');
      expect(
        (
          await client
            .from(table)
            .update(table === 'courses' ? { owner_id: actors.b.id } : { version: 90 })
            .eq('id', table === 'courses' ? draft.id : draft.revisionId)
        ).error?.code
      ).toBe('42501');
      expect(
        (
          await client
            .from(table)
            .delete()
            .eq('id', table === 'courses' ? draft.id : draft.revisionId)
        ).error?.code
      ).toBe('42501');
    }
    if (label === 'a') continue;
    const update = await client.rpc('update_course_draft', {
      course_id: draft.id,
      expected_version: 1,
      details,
    });
    const remove = await client.rpc('delete_course_draft', {
      course_id: draft.id,
      expected_version: 1,
    });
    if (label === 'b') {
      expect(update.data).toEqual({ ok: false, code: 'unavailable' });
      expect(remove.data).toEqual({ ok: false, code: 'unavailable' });
    } else {
      expect(update.error?.code).toBe('PT403');
      expect(remove.error?.code).toBe('PT403');
      expect(
        (await client.rpc('create_course_draft', { course_id: randomUUID(), details })).error?.code
      ).toBe('PT403');
    }
  }
  expect(
    (await actors.b.client.rpc('create_course_draft', { course_id: draft.id, details })).data
  ).toEqual({ ok: false, code: 'unavailable' });
  expect(
    (
      await actors.a.client.rpc('create_course_draft', {
        course_id: randomUUID(),
        details,
        owner_id: actors.b.id,
      })
    ).error
  ).toBeTruthy();
  expect(
    (await actors.student.client.auth.updateUser({ data: { role: 'faculty' } })).error
  ).toBeNull();
  expect(
    (await actors.student.client.rpc('create_course_draft', { course_id: randomUUID(), details }))
      .error?.code
  ).toBe('PT403');
}, 30000);
test('same stable UUID retries never overwrite and simultaneous writes increment exactly once', async () => {
  const id = randomUUID();
  const duplicates = await Promise.all([create(actors.a.client, id), create(actors.a.client, id)]);
  expect(duplicates[0]).toEqual(duplicates[1]);
  expect(
    (await actors.a.client.from('course_revisions').select('id').eq('course_id', id)).data
  ).toHaveLength(1);
  const updates = await Promise.all(
    ['First', 'Second'].map((title) =>
      actors.a.client.rpc('update_course_draft', {
        course_id: id,
        expected_version: 1,
        details: { ...details, title },
      })
    )
  );
  expect(updates.map((r) => r.data.ok).sort()).toEqual([false, true]);
  expect(updates.find((r) => !r.data.ok)?.data).toEqual({ ok: false, code: 'conflict' });
  const current = await actors.a.client.from('course_drafts').select('*').eq('id', id).single();
  expect(current.data.version).toBe(2);
  const [stale, latest] = await Promise.all([
    actors.a.client.rpc('delete_course_draft', { course_id: id, expected_version: 1 }),
    actors.a.client.rpc('update_course_draft', {
      course_id: id,
      expected_version: 2,
      details: { ...details, title: 'Latest' },
    }),
  ]);
  expect(stale.data).toEqual({ ok: false, code: 'conflict' });
  expect(latest.data.value.version).toBe(3);
  const retry = await actors.a.client.rpc('create_course_draft', { course_id: id, details });
  expect(retry.data.value).toMatchObject({ version: 3, details: { title: 'Latest' } });
});
test.each(['published', 'submitted', 'retained'])(
  '%s drafts cannot be deleted and rejection preserves the revision',
  async (action) => {
    const draft = await create();
    await courseHarness(action, { course_id: draft.id });
    expect(
      (
        await actors.a.client.rpc('delete_course_draft', {
          course_id: draft.id,
          expected_version: 1,
        })
      ).data
    ).toEqual({ ok: false, code: 'unavailable' });
    expect(
      (await actors.a.client.from('course_revisions').select('id').eq('course_id', draft.id)).data
    ).toHaveLength(1);
  }
);
test('native RPC validation matches Unicode bounds and rejects malformed data', async () => {
  for (const invalid of [
    { ...details, title: '😀'.repeat(201) },
    { ...details, description: 'x'.repeat(2001) },
    { ...details, priorKnowledge: 'x'.repeat(2001) },
    { ...details, outcomes: ['x'.repeat(501)] },
    { ...details, outcomes: [null] },
    { ...details, primaryTopic: 'Other' },
    { ...details, difficulty: 'Expert' },
    { ...details, estimatedHours: 0 },
    { ...details, estimatedHours: -1 },
    { ...details, estimatedHours: 'Infinity' },
    { ...details, estimatedHours: '' },
  ]) {
    expect(
      (
        await actors.a.client.rpc('create_course_draft', {
          course_id: randomUUID(),
          details: invalid,
        })
      ).data
    ).toEqual({ ok: false, code: 'validation' });
  }
  expect(
    (
      await actors.a.client.rpc('create_course_draft', {
        course_id: randomUUID(),
        details: {
          ...details,
          title: '😀'.repeat(200),
          description: '😀'.repeat(2000),
          priorKnowledge: '😀'.repeat(2000),
          outcomes: ['😀'.repeat(500), ''],
          estimatedHours: 1.5,
        },
      })
    ).data.ok
  ).toBe(true);
});
test('revocation observes the actor lock and an ordinary draft writer blocked by its holder', async () => {
  const fixture = await createFixture('faculty');
  await harness('state', { account_id: fixture.id, status: 'approved' });
  const { client } = await signIn(fixture);
  const draft = await create(client);
  const observation = {
    action: 'actor_lock_state',
    run_id: runId,
    args: { project_ref: testProjectRef, account_id: fixture.id },
  };
  expect((await client.rpc('test_course_fixture', observation)).error?.code).toBe('42501');
  expect(
    (
      await admin.rpc('test_course_fixture', {
        ...observation,
        args: { ...observation.args, project_ref: 'wrong' },
      })
    ).error
  ).toBeTruthy();
  expect(await courseHarness('actor_lock_state', { account_id: fixture.id })).toEqual({
    actorLockAcquired: false,
  });
  const revoke = courseHarness('revoke_locked', { account_id: fixture.id });
  void revoke.catch(() => {});
  // Await the holder even if observation fails, before afterAll removes this run's fixtures.
  try {
    await expect
      .poll(() => courseHarness('actor_lock_state', { account_id: fixture.id }), { timeout: 4000 })
      .toEqual({ actorLockAcquired: true });
    const write = client.rpc('update_course_draft', {
      course_id: draft.id,
      expected_version: 1,
      details: { ...details, title: 'Race' },
    });
    const [held, written] = await Promise.allSettled([revoke, write]);
    expect(held.status).toBe('fulfilled');
    expect(written.status).toBe('fulfilled');
    if (held.status === 'fulfilled')
      expect(held.value).toEqual({ actorLockAcquired: true, writerBlocked: true });
    if (written.status === 'fulfilled') expect(written.value.error?.code).toBe('PT401');
  } finally {
    await revoke;
  }
  expect(await courseHarness('actor_lock_state', { account_id: fixture.id })).toEqual({
    actorLockAcquired: false,
  });
  expect((await client.from('course_drafts').select('*').eq('id', draft.id)).data).toEqual([]);
  expect(
    (await client.rpc('delete_course_draft', { course_id: draft.id, expected_version: 1 })).error
      ?.code
  ).toBe('PT401');
  expect(
    (await client.rpc('create_course_draft', { course_id: randomUUID(), details })).error?.code
  ).toBe('PT401');
}, 15000);

test('a sub-1MiB request with 300000 blank outcomes has validator, DAL and native parity', async () => {
  const { validateDraftDetails } = await import('@/features/content/validation');
  const { createCourseDraft } = await import('@/features/content/courses');
  const large = { ...details, outcomes: Array<string>(300000).fill('') };
  const nativeId = randomUUID();
  expect(
    new TextEncoder().encode(JSON.stringify({ course_id: nativeId, details: large })).length
  ).toBeLessThan(1048576);
  expect(validateDraftDetails(large).ok).toBe(true);
  requestClient = actors.a.client;
  const app = await createCourseDraft(randomUUID(), large);
  expect.soft(app.ok).toBe(true);
  if (app.ok) expect(app.value.details.outcomes).toHaveLength(300000);
  const native = await actors.a.client.rpc('create_course_draft', {
    course_id: nativeId,
    details: large,
  });
  expect(native.error).toBeNull();
  expect(native.data.ok).toBe(true);
  expect(native.data.value.details.outcomes).toHaveLength(300000);
}, 30000);

test('TEST helpers refuse ordinary callers, wrong markers and other runs', async () => {
  const draft = await create();
  const args = {
    action: 'retained',
    run_id: runId,
    args: { project_ref: testProjectRef, course_id: draft.id },
  };
  expect((await actors.a.client.rpc('test_course_fixture', args)).error?.code).toBe('42501');
  expect(
    (
      await admin.rpc('test_course_fixture', {
        ...args,
        args: { ...args.args, project_ref: 'wrong' },
      })
    ).error
  ).toBeTruthy();
  expect(
    (await admin.rpc('test_course_fixture', { ...args, run_id: randomUUID() })).error
  ).toBeTruthy();
  expect(
    (await admin.rpc('test_course_fixture', { ...args, action: 'cleanup', run_id: randomUUID() }))
      .error
  ).toBeNull();
  expect(
    (await actors.a.client.from('course_drafts').select('id').eq('id', draft.id)).data
  ).toHaveLength(1);
});

test.each(['empty', 'uncreated reservation'])(
  'TEST revocation rejects a different %s run and keeps this run’s account active',
  async (kind) => {
    const target = await createFixture('faculty');
    const otherRunId = randomUUID();
    const journal = `tests/integration/.artifacts/${otherRunId}.json`;
    const { saveFixtureJournal } = await import('./helpers/fixture-journal.mjs');
    const { mkdir, unlink } = await import('node:fs/promises');
    await mkdir('tests/integration/.artifacts', { recursive: true });
    await saveFixtureJournal(journal, {
      projectRef: testProjectRef,
      runId: otherRunId,
      accountIds: [],
    });
    try {
      if (kind === 'uncreated reservation') {
        const reservation = await admin.rpc('test_account_fixture', {
          action: 'reserve',
          run_id: otherRunId,
          args: {
            project_ref: testProjectRef,
            email: `fixture-${otherRunId.slice(0, 8)}-${randomUUID()}@example.invalid`,
            role: 'faculty',
          },
        });
        expect(reservation.error).toBeNull();
      }
      for (const action of ['actor_lock_state', 'revoke_locked']) {
        const result = await admin.rpc('test_course_fixture', {
          action,
          run_id: otherRunId,
          args: { project_ref: testProjectRef, account_id: target.id },
        });
        expect.soft(result.error).toMatchObject({
          code: 'P0001',
          message: 'Unknown fixture account',
        });
      }
      expect((await harness('inspect', { account_id: target.id })).active).toBe(true);
    } finally {
      const cleanup = await admin.rpc('test_account_fixture', {
        action: 'cleanup',
        run_id: otherRunId,
        args: { project_ref: testProjectRef },
      });
      if (cleanup.error) throw new Error('Retain exact-run revocation regression journal');
      await unlink(journal);
    }
  }
);
