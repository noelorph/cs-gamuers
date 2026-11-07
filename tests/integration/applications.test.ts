// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
vi.mock('server-only', () => ({}));
import { confirmProof, proofHash } from '../../src/features/accounts/email-protocol';
import {
  admin,
  anonymous,
  cleanFixtures,
  createFixture,
  harness,
  runId,
  signIn,
  testProjectRef,
} from './helpers/fixtures';

afterAll(cleanFixtures, 30000);
let faculty: SupabaseClient;
let administrator: SupabaseClient;
let head: SupabaseClient;
let pendingFaculty: SupabaseClient;
beforeAll(async () => {
  const clients = [];
  for (const role of ['faculty', 'administrator', 'program_head', 'faculty']) {
    const f = await createFixture(role);
    if (clients.length < 3) await harness('state', { account_id: f.id, status: 'approved' });
    clients.push((await signIn(f)).client);
  }
  [faculty, administrator, head, pendingFaculty] = clients;
}, 30000);

async function applicant(role = 'student') {
  const f = await createFixture(role, false);
  // Generated native proof is test transport; this does not assert native hook or inbox delivery.
  const link = await admin.auth.admin.generateLink({
    type: 'signup',
    email: f.email,
    password: 'unused existing account password',
  });
  if (link.error) throw Error('Generated proof unavailable');
  const queued = await admin.rpc('queue_generated_auth_email', {
    target_id: f.id,
    recipient: f.email,
    native_type: 'signup',
    native_verifier: link.data.properties.hashed_token,
  });
  if (queued.error) throw Error('Proof queue unavailable');
  const p = await admin.rpc('test_email_fixture', {
    action: 'inspect',
    run_id: runId,
    args: { project_ref: testProjectRef, account_id: f.id },
  });
  await confirmProof(admin, anonymous(), p.data.challenge, proofHash(randomUUID()));
  return { ...f, client: (await signIn(f)).client };
}
const read = (client: SupabaseClient, id?: string) =>
  client.rpc('application_details', { target_id: id ?? null });
const decision = (
  client: SupabaseClient,
  id: string,
  version: number,
  choice = 'approve',
  extra = {}
) =>
  client.rpc('review_application', {
    target_id: id,
    expected_version: version,
    request_id: randomUUID(),
    decision: choice,
    reason: choice === 'approve' ? null : 'Synthetic review reason',
    attestations: {
      enrollment: true,
      authorization: true,
      employee_id: true,
      email_owner: true,
      error_verified: true,
    },
    ...extra,
  });

describe('ordinary-session application review', { timeout: 15000 }, () => {
  it('allows Faculty to read and approve a verified Student with a recorded notice', async () => {
    const f = await applicant();
    const detail = await read(faculty, f.id);
    expect(detail.error).toBeNull();
    expect(detail.data).toMatchObject({
      id: f.id,
      email: f.email,
      student_number: f.studentNumber,
      email_verified: true,
      version: 1,
    });
    expect(detail.data).not.toHaveProperty('delivery_state');
    const saved = await decision(faculty, f.id, 1);
    expect(saved.error).toBeNull();
    expect((await read(f.client)).data).toMatchObject({ status: 'approved', version: 2 });
    const detailAdmin = (await read(administrator, f.id)).data;
    expect(detailAdmin.delivery_state).toBe('pending');
    expect(detailAdmin.history).toHaveLength(1);
  });

  it('restricts Faculty targets, Program Heads, unapproved reviewers and applicant isolation', async () => {
    const f = await applicant('faculty');
    for (const client of [faculty, head, pendingFaculty]) {
      expect((await read(client, f.id)).error?.code).toBe('42501');
      expect((await decision(client, f.id, 1)).error?.code).toBe('42501');
    }
    expect((await decision(f.client, f.id, 1)).error?.code).toBe('42501');
    const other = await applicant();
    expect((await read(other.client, f.id)).error?.code).toBe('42501');
    expect((await decision(administrator, f.id, 1)).error).toBeNull();
    expect(
      (await anonymous().rpc('application_details', { target_id: f.id })).error
    ).not.toBeNull();
    expect((await admin.rpc('application_details', { target_id: f.id })).error).not.toBeNull();
  });

  it('requires external attestations and nonempty bounded reasons without saving a decision', async () => {
    const f = await applicant('faculty');
    expect(
      (await decision(administrator, f.id, 1, 'approve', { attestations: { authorization: true } }))
        .error?.code
    ).toBe('23514');
    for (const reason of ['', 'x'.repeat(2001)])
      expect((await decision(administrator, f.id, 1, 'reject', { reason })).error?.code).toBe(
        '23514'
      );
    expect((await read(administrator, f.id)).data.history).toHaveLength(0);
  });

  it('preserves repeated correction cycles and binds decision retries to actor and payload', async () => {
    const f = await applicant();
    const request = randomUUID();
    const first = await decision(faculty, f.id, 1, 'needs_correction', { request_id: request });
    expect(first.error).toBeNull();
    expect(
      (await decision(faculty, f.id, 1, 'needs_correction', { request_id: request })).error
    ).toBeNull();
    expect((await decision(faculty, f.id, 1, 'reject', { request_id: request })).error?.code).toBe(
      '23514'
    );
    expect(
      (await decision(administrator, f.id, 1, 'needs_correction', { request_id: request })).error
        ?.code
    ).toBe('23514');
    expect(
      (
        await f.client.rpc('save_application', {
          expected_version: 2,
          full_name: 'Corrected synthetic name',
          student_number: f.studentNumber,
          employee_number: null,
        })
      ).error
    ).toBeNull();
    expect((await read(f.client)).data).toMatchObject({ status: 'needs_correction', version: 3 });
    expect((await f.client.rpc('resubmit_application', { expected_version: 3 })).error).toBeNull();
    expect(
      (await decision(faculty, f.id, 1, 'needs_correction', { request_id: request })).data
    ).toMatchObject({ status: 'pending', version: 4 });
    expect((await decision(faculty, f.id, 4, 'needs_correction')).error).toBeNull();
    expect(
      (await read(administrator, f.id)).data.history.filter(
        (e: { event: string }) => e.event === 'application_needs_correction'
      )
    ).toHaveLength(2);
  });

  it('rejects stale reviews and permits only one concurrent decision', async () => {
    const f = await applicant();
    expect(
      (
        await f.client.rpc('save_application', {
          expected_version: 1,
          full_name: 'New synthetic name',
          student_number: f.studentNumber,
          employee_number: null,
        })
      ).error
    ).toBeNull();
    expect((await decision(faculty, f.id, 1)).error?.code).toBe('PT409');
    const results = await Promise.all([
      decision(faculty, f.id, 2),
      decision(administrator, f.id, 2, 'reject'),
    ]);
    expect(results.filter((r) => !r.error)).toHaveLength(1);
    expect(results.filter((r) => r.error?.code === 'PT409')).toHaveLength(1);
    expect((await read(administrator, f.id)).data.history).toHaveLength(1);
  });

  it('allows only Administrator reopening with a reason and verified error; reopening preserves identity and activation', async () => {
    const f = await applicant();
    expect((await decision(faculty, f.id, 1, 'reject')).error).toBeNull();
    expect((await f.client.rpc('resubmit_application', { expected_version: 2 })).error?.code).toBe(
      '42501'
    );
    expect((await decision(faculty, f.id, 2, 'reopen')).error?.code).toBe('42501');
    expect(
      (await decision(administrator, f.id, 2, 'reopen', { attestations: {} })).error?.code
    ).toBe('23514');
    expect((await decision(administrator, f.id, 2, 'reopen')).error).toBeNull();
    expect((await read(f.client)).data).toMatchObject({
      status: 'pending',
      role: 'student',
      email: f.email,
      student_number: f.studentNumber,
    });
    await harness('state', { account_id: f.id, active: false });
    expect((await decision(administrator, f.id, 3)).error?.code).toBe('42501');
  });

  it('rechecks reviewer revocation even for a previously saved request ID', async () => {
    const reviewer = await createFixture('faculty');
    await harness('state', { account_id: reviewer.id, status: 'approved' });
    const client = (await signIn(reviewer)).client;
    const f = await applicant();
    const request = randomUUID();
    expect((await decision(client, f.id, 1, 'reject', { request_id: request })).error).toBeNull();
    await harness('cutoff', { account_id: reviewer.id });
    expect((await decision(client, f.id, 1, 'reject', { request_id: request })).error?.code).toBe(
      '42501'
    );
  });
});

describe('preapproval identity correction', { timeout: 20000 }, () => {
  it('retains former student numbers until an Administrator verifies release', async () => {
    const f = await applicant();
    const number = '00' + randomUUID();
    expect(
      (
        await f.client.rpc('save_application', {
          expected_version: 1,
          full_name: 'Synthetic applicant',
          student_number: number,
          employee_number: null,
        })
      ).error
    ).toBeNull();
    const other = await applicant();
    const attempt = () =>
      other.client.rpc('save_application', {
        expected_version: 1,
        full_name: 'Synthetic other applicant',
        student_number: f.studentNumber,
        employee_number: null,
      });
    expect((await attempt()).error?.code).toBe('23505');
    const release = {
      target_id: f.id,
      expected_version: 2,
      student_number: f.studentNumber,
      replacement_number: null,
      reason: 'Synthetic verified mistaken entry',
      error_verified: true,
    };
    expect((await faculty.rpc('correct_student_number', release)).error?.code).toBe('42501');
    expect(
      (await administrator.rpc('correct_student_number', { ...release, error_verified: false }))
        .error?.code
    ).toBe('23514');
    expect((await administrator.rpc('correct_student_number', release)).error).toBeNull();
    expect((await attempt()).error).toBeNull();
  });
  it('requires an unclaimed verified replacement before releasing a current number', async () => {
    const f = await applicant();
    const other = await applicant();
    const input = {
      target_id: f.id,
      expected_version: 1,
      student_number: f.studentNumber,
      replacement_number: null,
      reason: 'Synthetic verified current number mistake.',
      error_verified: true,
    };
    expect((await administrator.rpc('correct_student_number', input)).error?.code).toBe('23514');
    expect(
      (
        await administrator.rpc('correct_student_number', {
          ...input,
          replacement_number: other.studentNumber,
        })
      ).error?.code
    ).toBe('23505');
    expect((await read(f.client)).data).toMatchObject({
      student_number: f.studentNumber,
      version: 1,
    });
    const number = '00' + randomUUID();
    expect(
      (await administrator.rpc('correct_student_number', { ...input, replacement_number: number }))
        .error
    ).toBeNull();
    expect((await read(f.client)).data).toMatchObject({
      student_number: number,
      email: f.email,
      role: 'student',
      status: 'pending',
    });
    expect(
      (await administrator.rpc('correct_student_number', { ...input, replacement_number: number }))
        .error?.code
    ).toBe('PT409');
    expect(
      (
        await other.client.rpc('save_application', {
          expected_version: 1,
          full_name: 'Synthetic corrected holder',
          student_number: f.studentNumber,
          employee_number: null,
        })
      ).error
    ).toBeNull();
  });
  it('rejects replacement email collisions and expired possession proof without changing identity', async () => {
    const f = await applicant();
    const other = await applicant();
    expect(
      (await f.client.rpc('request_application_email', { expected_version: 1, email: other.email }))
        .error?.code
    ).toBe('23514');
    expect((await read(f.client)).data).toMatchObject({ email: f.email, version: 1 });
    const email = `fixture-${runId.slice(0, 8)}-${randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`;
    expect(
      (await f.client.rpc('request_application_email', { expected_version: 1, email })).error
    ).toBeNull();
    const proof = await admin.rpc('test_email_fixture', {
      action: 'expire',
      run_id: runId,
      args: { project_ref: testProjectRef, account_id: f.id },
    });
    const admission = vi.fn(async () => {});
    await expect(
      confirmProof(admin, anonymous(), proof.data.challenge, proofHash(randomUUID()), admission)
    ).rejects.toThrow();
    expect(admission).not.toHaveBeenCalled();
    expect((await admin.rpc('reconcile_auth_mail')).error).toBeNull();
    expect((await read(f.client)).data).toMatchObject({ email: f.email, replacement: null });
  });
  it('requires fresh replacement-email proof, preserves identity until completion and revokes old sessions', async () => {
    const f = await applicant();
    const replacement = `fixture-${runId.slice(0, 8)}-${randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`;
    const queued = await f.client.rpc('request_application_email', {
      expected_version: 1,
      email: replacement,
    });
    expect(queued.error).toBeNull();
    expect((await read(f.client)).data).toMatchObject({
      email: f.email,
      replacement: { email: replacement },
    });
    expect((await decision(faculty, f.id, 2)).error?.code).toBe('55000');
    const p = await admin.rpc('test_email_fixture', {
      action: 'inspect',
      run_id: runId,
      args: { project_ref: testProjectRef, account_id: f.id },
    });
    const cap = proofHash(randomUUID());
    await expect(confirmProof(admin, anonymous(), p.data.challenge, cap)).rejects.toThrow();
    const admission = vi.fn(async () => {
      throw Error('Synthetic admission denial');
    });
    await expect(
      confirmProof(admin, anonymous(), p.data.challenge, cap, admission)
    ).rejects.toThrow('Synthetic admission denial');
    expect((await admin.auth.admin.getUserById(f.id)).data.user?.email).toBe(f.email);
    expect((await read(f.client)).data).toMatchObject({ email: f.email });
    expect(admission).toHaveBeenCalledTimes(1);
    admission.mockImplementation(async () => undefined as never);
    const result = await confirmProof(admin, anonymous(), p.data.challenge, cap, admission);
    expect(admission).toHaveBeenCalledTimes(2);
    expect(result.purpose).toBe('replacement');
    expect((await admin.auth.admin.getUserById(f.id)).data.user?.email).toBe(replacement);
    expect((await read(f.client)).error?.code).toBe('42501');
    const fresh = (await signIn({ email: replacement })).client;
    expect((await read(fresh)).data).toMatchObject({
      email: replacement,
      email_verified: true,
      status: 'pending',
      student_number: f.studentNumber,
    });
    await expect(
      confirmProof(admin, anonymous(), p.data.challenge, proofHash(randomUUID()))
    ).rejects.toThrow();
  });
  it('cancels replacement proof without releasing a disputed student number', async () => {
    const f = await applicant();
    const replacement = `fixture-${runId.slice(0, 8)}-${randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`;
    expect(
      (await f.client.rpc('request_application_email', { expected_version: 1, email: replacement }))
        .error
    ).toBeNull();
    const p = await admin.rpc('test_email_fixture', {
      action: 'inspect',
      run_id: runId,
      args: { project_ref: testProjectRef, account_id: f.id },
    });
    expect(
      (await f.client.rpc('cancel_application_email', { expected_version: 2 })).error
    ).toBeNull();
    await expect(
      confirmProof(admin, anonymous(), p.data.challenge, proofHash(randomUUID()))
    ).rejects.toThrow();
    expect((await read(f.client)).data).toMatchObject({ email: f.email, replacement: null });
  });
});
async function applicationHarness(action: string, id: string) {
  const r = await admin.rpc('test_application_fixture', {
    action,
    run_id: runId,
    args: { project_ref: testProjectRef, account_id: id },
  });
  if (r.error) throw Error('Application fixture failed: ' + r.error.code);
  return r.data;
}
describe('application transaction failure boundaries', { timeout: 15000 }, () => {
  it('rolls back the decision and history if outbox insertion fails', async () => {
    const f = await applicant();
    await applicationHarness('fail_outbox', f.id);
    expect((await decision(faculty, f.id, 1)).error).not.toBeNull();
    expect((await read(f.client)).data).toMatchObject({
      status: 'pending',
      version: 1,
      history: [],
    });
    expect(await applicationHarness('inspect', f.id)).toMatchObject({ events: 0, notices: 0 });
    await applicationHarness('allow_outbox', f.id);
    expect((await decision(faculty, f.id, 1)).error).toBeNull();
  });
  it('keeps a saved decision through failed delivery and independent retry', async () => {
    const f = await applicant();
    expect((await decision(faculty, f.id, 1, 'needs_correction')).error).toBeNull();
    const { deliverBatch } = await import('../../scripts/mail-worker.mjs');
    const client = {
      rpc: async (name: string, args: Record<string, unknown>) =>
        name === 'claim_mail_work'
          ? { data: await applicationHarness('claim_notices', f.id), error: null }
          : admin.rpc(name, args),
    };
    const sent: string[] = [];
    await deliverBatch(
      client,
      {
        sendMail: async (mail: { text: string }) => {
          sent.push(mail.text);
          throw Error('Synthetic SMTP outage');
        },
      },
      { origin: 'https://demo.example', from: 'fixture@example.invalid' }
    );
    expect((await read(f.client)).data).toMatchObject({ status: 'needs_correction', version: 2 });
    expect(sent[0]).toContain('Synthetic review reason');
    await deliverBatch(
      client,
      { sendMail: async (mail: { to: string }) => ({ accepted: [mail.to] }) },
      { origin: 'https://demo.example', from: 'fixture@example.invalid' }
    );
    expect(await applicationHarness('inspect', f.id)).toMatchObject({ events: 1, notices: 1 });
    expect((await read(administrator, f.id)).data.delivery_state).toBe('sent');
  });
  it('rechecks the locked reviewer row after concurrent revocation', async () => {
    const f = await applicant();
    const reviewer = await createFixture('faculty');
    await harness('state', { account_id: reviewer.id, status: 'approved' });
    const client = (await signIn(reviewer)).client;
    const revocation = applicationHarness('revoke_locked', reviewer.id);
    let held = false;
    for (let attempt = 0; attempt < 20 && !held; attempt++)
      held = await applicationHarness('lock_held', reviewer.id);
    expect(held).toBe(true);
    const result = await decision(client, f.id, 1);
    await revocation;
    expect(result.error?.code).toBe('42501');
    expect((await read(f.client)).data.status).toBe('pending');
  });
  it.each(['deactivated', 'rejected', 'expired'])(
    'fences a late Auth replacement write after %s and recovers the old identity',
    async (state) => {
      const f = await applicant();
      const replacement = `fixture-${runId.slice(0, 8)}-${randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`;
      expect(
        (
          await f.client.rpc('request_application_email', {
            expected_version: 1,
            email: replacement,
          })
        ).error
      ).toBeNull();
      const inspect = async (action = 'inspect') =>
        admin.rpc('test_email_fixture', {
          action,
          run_id: runId,
          args: { project_ref: testProjectRef, account_id: f.id },
        });
      const proof = (await inspect()).data;
      const cap = proofHash(randomUUID());
      const claim = await admin.rpc('claim_email_challenge', {
        challenge_hash: proofHash(proof.challenge),
        capability_hash: cap,
      });
      expect(claim.error).toBeNull();
      expect(
        (
          await admin.rpc('advance_email_operation', {
            proof_id: claim.data.proof_id,
            capability_hash: cap,
            step: 'apply',
            full_name: null,
          })
        ).error
      ).toBeNull();
      if (state === 'deactivated') await harness('state', { account_id: f.id, active: false });
      if (state === 'rejected') await harness('state', { account_id: f.id, status: 'rejected' });
      if (state === 'expired') await inspect('age_operation');
      if (state !== 'expired') {
        const user = (await admin.auth.admin.getUserById(f.id)).data.user!;
        const beforeReconcile = await admin.auth.admin.updateUserById(f.id, {
          email: replacement,
          email_confirm: true,
          app_metadata: { ...user.app_metadata, identity_operation_id: claim.data.operation_id },
        });
        expect(beforeReconcile.error).not.toBeNull();
      }
      expect((await admin.rpc('reconcile_auth_mail')).error).toBeNull();
      const current = (await admin.auth.admin.getUserById(f.id)).data.user!;
      const late = await admin.auth.admin.updateUserById(f.id, {
        email: replacement,
        email_confirm: true,
        app_metadata: { ...current.app_metadata, identity_operation_id: claim.data.operation_id },
      });
      expect(late.error).not.toBeNull();
      expect((await admin.auth.admin.getUserById(f.id)).data.user?.email).toBe(f.email);
      expect(await applicationHarness('inspect', f.id)).toMatchObject({ identity_blocked: false });
    }
  );
});
it.each(['active', 'deactivated', 'rejected'])(
  'commits identity notice and finalizes after post-commit %s state',
  async (state) => {
    const f = await applicant();
    const replacement = `fixture-${runId.slice(0, 8)}-${randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`;
    expect(
      (await f.client.rpc('request_application_email', { expected_version: 1, email: replacement }))
        .error
    ).toBeNull();
    const proof = (
      await admin.rpc('test_email_fixture', {
        action: 'inspect',
        run_id: runId,
        args: { project_ref: testProjectRef, account_id: f.id },
      })
    ).data;
    const cap = proofHash(randomUUID());
    const claim = await admin.rpc('claim_email_challenge', {
      challenge_hash: proofHash(proof.challenge),
      capability_hash: cap,
    });
    expect(claim.error).toBeNull();
    expect(
      (
        await admin.rpc('advance_email_operation', {
          proof_id: claim.data.proof_id,
          capability_hash: cap,
          step: 'apply',
          full_name: null,
        })
      ).error
    ).toBeNull();
    const user = (await admin.auth.admin.getUserById(f.id)).data.user!;
    expect(
      (
        await admin.auth.admin.updateUserById(f.id, {
          email: replacement,
          email_confirm: true,
          app_metadata: { ...user.app_metadata, identity_operation_id: claim.data.operation_id },
        })
      ).error
    ).toBeNull();
    expect(await applicationHarness('inspect', f.id)).toMatchObject({
      events: 1,
      notices: 1,
      identity_blocked: true,
    });
    const jobs = await applicationHarness('claim_notices', f.id);
    expect(jobs).toMatchObject([{ recipient: f.email, kind: 'identity_changed' }]);
    if (state === 'deactivated') await harness('state', { account_id: f.id, active: false });
    if (state === 'rejected') await harness('state', { account_id: f.id, status: 'rejected' });
    expect((await admin.rpc('reconcile_auth_mail')).error).toBeNull();
    expect((await admin.auth.admin.getUserById(f.id)).data.user?.email).toBe(replacement);
    expect(await harness('inspect', { account_id: f.id })).toMatchObject({
      active: state !== 'deactivated',
      status: state === 'rejected' ? 'rejected' : 'pending',
      role: 'student',
      email: replacement,
      student_number: f.studentNumber,
    });
    expect(await applicationHarness('inspect', f.id)).toMatchObject({
      events: 1,
      notices: 1,
      identity_blocked: false,
    });
  },
  15000
);
it('controlled demo approval cannot bypass an incomplete replacement identity', async () => {
  const f = await applicant();
  await applicationHarness('demo_slot', f.id);
  const email = `fixture-${runId.slice(0, 8)}-${randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`;
  expect(
    (await f.client.rpc('request_application_email', { expected_version: 1, email })).error
  ).toBeNull();
  const result = await administrator.rpc('approve_demo_application', {
    project_ref: testProjectRef,
    target_id: f.id,
    reason: 'Synthetic fixture only; no school evidence asserted.',
  });
  expect(result.error).not.toBeNull();
  expect((await read(f.client)).data.status).toBe('pending');
}, 15000);
it('controlled demo approval rejects an application corrected since its initial setup identity', async () => {
  const f = await applicant();
  await applicationHarness('demo_slot', f.id);
  expect(
    (
      await f.client.rpc('save_application', {
        expected_version: 1,
        full_name: 'Changed synthetic application',
        student_number: f.studentNumber,
        employee_number: null,
      })
    ).error
  ).toBeNull();
  expect(
    (
      await administrator.rpc('approve_demo_application', {
        project_ref: testProjectRef,
        target_id: f.id,
        reason: 'Synthetic fixture only.',
      })
    ).error
  ).not.toBeNull();
  expect((await read(f.client)).data.status).toBe('pending');
}, 15000);
