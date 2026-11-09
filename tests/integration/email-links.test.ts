// @vitest-environment node
import { createHash, randomBytes } from 'node:crypto';
import { afterAll, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import {
  admin,
  anonymous,
  cleanFixtures,
  createFixture,
  harness,
  runId,
  testProjectRef,
} from './helpers/fixtures';

afterAll(cleanFixtures, 30000);

describe('controlled email proofs', () => {
  it('queues only an exact reserved recipient and returns no native proof', async () => {
    const fixture = await createFixture('faculty', false);
    const result = await admin.rpc('queue_generated_auth_email', {
      target_id: fixture.id,
      recipient: fixture.email,
      native_type: 'signup',
      native_verifier: 'synthetic-verifier-for-queue-only',
    });
    expect(result.error?.code ?? null).toBe(null);
    expect(result.data).toEqual({ queued: true });
  });

  it('denies anonymous generated-proof enqueue', async () => {
    const fixture = await createFixture('faculty', false);
    const result = await anonymous().rpc('queue_generated_auth_email', {
      target_id: fixture.id,
      recipient: fixture.email,
      native_type: 'signup',
      native_verifier: 'synthetic-verifier-for-queue-only',
    });
    expect(Boolean(result.error)).toBe(true);
  });
});

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const capability = () => hash(randomBytes(32).toString('hex'));
async function proofFixture() {
  const fixture = await createFixture('faculty', false);
  const queued = await admin.rpc('queue_generated_auth_email', {
    target_id: fixture.id,
    recipient: fixture.email,
    native_type: 'signup',
    native_verifier: 'synthetic-verifier-for-queue-only',
  });
  if (queued.error) throw new Error('Queue unavailable');
  return fixture;
}
async function inspect(id: string, action = 'inspect', extra = {}) {
  const r = await admin.rpc('test_email_fixture', {
    action,
    run_id: runId,
    args: { project_ref: testProjectRef, account_id: id, ...extra },
  });
  if (r.error) throw new Error('Email fixture unavailable');
  return r.data;
}
it('consumes once and resumes only with the original restricted capability', async () => {
  const f = await proofFixture();
  const p = await inspect(f.id);
  const cap = capability();
  const claim = () =>
    admin.rpc('claim_email_challenge', { challenge_hash: hash(p.challenge), capability_hash: cap });
  expect(Boolean((await claim()).error)).toBe(false);
  expect((await claim()).data).toHaveProperty('proof_id', p.id);
  expect(
    Boolean(
      (
        await admin.rpc('claim_email_challenge', {
          challenge_hash: hash(p.challenge),
          capability_hash: capability(),
        })
      ).error
    )
  ).toBe(true);
  expect(await inspect(f.id)).toHaveProperty('delivery_erased', true);
});
it('pre-send validation rejects a superseded proof, expired lease and wrong claimant', async () => {
  const f = await proofFixture();
  const claimed = await admin.rpc('claim_mail_work', { batch_size: 20 });
  expect(Boolean(claimed.error)).toBe(false);
  const job = claimed.data.find((j: { recipient: string }) => j.recipient === f.email);
  expect(job).toBeTruthy();
  const args = { work_id: job.id, claim_id: job.lease_id };
  const ready = await admin.rpc('prepare_mail_work', args);
  expect(ready.error?.code ?? null).toBe(null);
  expect(ready.data).toBe(true);
  expect((await admin.rpc('prepare_mail_work', { ...args, claim_id: runId })).data).toBe(false);
  expect(Boolean((await anonymous().rpc('prepare_mail_work', args)).error)).toBe(true);
  await inspect(f.id, 'expire_mail_lease');
  expect((await admin.rpc('prepare_mail_work', args)).data).toBe(false);
  const reclaimed = await admin.rpc('claim_mail_work', { batch_size: 20 });
  const newer = reclaimed.data.find((j: { id: string }) => j.id === job.id);
  expect(newer.lease_id).not.toBe(job.lease_id);
  await inspect(f.id, 'age_latest');
  const reissued = await admin.rpc('queue_generated_auth_email', {
    target_id: f.id,
    recipient: f.email,
    native_type: 'signup',
    native_verifier: 'synthetic-new-verifier-for-queue-only',
  });
  expect(Boolean(reissued.error)).toBe(false);
  expect(
    (await admin.rpc('prepare_mail_work', { work_id: job.id, claim_id: newer.lease_id })).data
  ).toBe(false);
});
it('does not send a queued proof superseded while the previous SMTP send is pending', async () => {
  const { deliverBatch } = await import('../../scripts/mail-worker.mjs');
  const first = await proofFixture();
  const second = await proofFixture();
  const sent: string[] = [];
  await deliverBatch(
    admin,
    {
      sendMail: async (message: { to: string }) => {
        sent.push(message.to);
        if (message.to === first.email) {
          await inspect(second.id, 'age_latest');
          const result = await admin.rpc('queue_generated_auth_email', {
            target_id: second.id,
            recipient: second.email,
            native_type: 'signup',
            native_verifier: 'synthetic-superseding-verifier-for-queue-only',
          });
          expect(Boolean(result.error)).toBe(false);
        }
        return { accepted: [message.to] };
      },
    },
    { origin: 'https://demo.example', from: 'sender@example.com' }
  );
  expect(sent).toContain(first.email);
  expect(sent).not.toContain(second.email);
});
it('expires exactly at 1800 seconds and erases expired secret material', async () => {
  const f = await proofFixture();
  const p = await inspect(f.id);
  expect(p.lifetime_seconds).toBe(1800);
  await inspect(f.id, 'expire');
  expect(
    Boolean(
      (
        await admin.rpc('claim_email_challenge', {
          challenge_hash: hash(p.challenge),
          capability_hash: capability(),
        })
      ).error
    )
  ).toBe(true);
  expect(Boolean((await admin.rpc('reconcile_auth_mail')).error)).toBe(false);
  expect(await inspect(f.id)).toHaveProperty('native_erased', true);
});
it('enforces recipient, purpose, 60-second minimum, and rolling five-issue ceiling', async () => {
  const f = await proofFixture();
  const issue = (recipient = f.email, native_type = 'signup') =>
    admin.rpc('queue_generated_auth_email', {
      target_id: f.id,
      recipient,
      native_type,
      native_verifier: 'synthetic-verifier-for-queue-only',
    });
  expect(Boolean((await issue('wrong@example.com')).error)).toBe(true);
  expect(Boolean((await issue(f.email, 'recovery')).error)).toBe(true);
  expect(Boolean((await issue()).error)).toBe(true);
  for (let i = 0; i < 4; i++) {
    await inspect(f.id, 'age_latest');
    expect(Boolean((await issue()).error)).toBe(false);
  }
  await inspect(f.id, 'age_latest');
  expect(Boolean((await issue()).error)).toBe(true);
});
it('reissue invalidates the older proof and its delivery work', async () => {
  const f = await proofFixture();
  const p = await inspect(f.id);
  await inspect(f.id, 'age_latest');
  expect(
    Boolean(
      (
        await admin.rpc('queue_generated_auth_email', {
          target_id: f.id,
          recipient: f.email,
          native_type: 'signup',
          native_verifier: 'second-synthetic-verifier',
        })
      ).error
    )
  ).toBe(false);
  expect(
    Boolean(
      (
        await admin.rpc('claim_email_challenge', {
          challenge_hash: hash(p.challenge),
          capability_hash: capability(),
        })
      ).error
    )
  ).toBe(true);
});
it('rejects approval by a pending account and never self-approves', async () => {
  const f = await createFixture('faculty');
  const { signIn } = await import('./helpers/fixtures');
  const { client } = await signIn(f);
  expect(
    Boolean(
      (
        await client.rpc('approve_demo_application', {
          project_ref: testProjectRef,
          target_id: f.id,
          reason: 'Synthetic fixture approval',
        })
      ).error
    )
  ).toBe(true);
  await harness('state', { account_id: f.id, status: 'approved' });
  expect(
    Boolean(
      (
        await client.rpc('approve_demo_application', {
          project_ref: testProjectRef,
          target_id: f.id,
          reason: 'Synthetic fixture approval',
        })
      ).error
    )
  ).toBe(true);
});
it('exposes a protected resumable bootstrap boundary and rejects changed project', async () => {
  const r = await admin.rpc('bootstrap_demo_administrator', {
    project_ref: 'wrong-project',
    manifest_hash: 'a'.repeat(64),
    email: 'fixture-bootstrap@example.com',
    full_name: 'Synthetic Administrator',
  });
  expect(Boolean(r.error)).toBe(true);
  expect(r.error?.code).not.toBe('PGRST202');
});
it('completes a real native invitation through two fenced operations and requires fresh password sign-in', async () => {
  const { reserveFixture, actor, signIn } = await import('./helpers/fixtures');
  const f = await reserveFixture('program_head');
  const generated = await admin.auth.admin.generateLink({
    type: 'invite',
    email: f.email,
    options: { data: { full_name: 'Synthetic integration fixture' } },
  });
  expect(Boolean(generated.error)).toBe(false);
  const id = generated.data.user!.id;
  expect(
    Boolean(
      (
        await admin.rpc('queue_generated_auth_email', {
          target_id: id,
          recipient: f.email,
          native_type: 'invite',
          native_verifier: generated.data.properties!.hashed_token,
        })
      ).error
    )
  ).toBe(false);
  const p = await inspect(id);
  const subject = await import('@/features/accounts/email-protocol').catch(() => null);
  expect(subject?.confirmProof).toBeTypeOf('function');
  if (!subject) return;
  const cap = capability();
  const operation = await subject.confirmProof(admin, anonymous(), p.challenge, cap);
  expect(operation.purpose).toBe('invitation');
  expect(operation).toHaveProperty('invitation', { email: f.email, role: 'program_head' });
  expect(
    Boolean(
      (
        await admin.rpc('apply_invitation_details', {
          proof_id: operation.operationId,
          capability_hash: capability(),
          employee_number: 'intruder',
          full_name: 'Intruder',
        })
      ).error
    )
  ).toBe(true);
  expect(
    Boolean(
      (
        await anonymous().rpc('apply_invitation_details', {
          proof_id: operation.operationId,
          capability_hash: cap,
          employee_number: 'intruder',
          full_name: 'Intruder',
        })
      ).error
    )
  ).toBe(true);
  expect(await subject.confirmProof(admin, anonymous(), p.challenge, cap)).toEqual(operation);
  const password = 'Holder chosen synthetic passphrase';
  await subject.finishInvitation(admin, operation.operationId, cap, {
    fullName: 'Synthetic invited holder',
    password,
    employeeNumber: '001-A',
  });
  await subject.finishInvitation(admin, operation.operationId, cap, {
    fullName: 'Synthetic invited holder',
    password,
  });
  const signed = await signIn(f, password);
  expect(await actor(signed.client)).toHaveLength(1);
  expect((await inspect(id)).employee_number).toBe('001-A');
  const replay = await admin.rpc('apply_invitation_details', {
    proof_id: operation.operationId,
    capability_hash: cap,
    employee_number: 'changed-after-approval',
    full_name: 'Changed after approval',
  });
  expect(Boolean(replay.error)).toBe(true);
  expect((await inspect(id)).employee_number).toBe('001-A');
  expect(await inspect(id)).toHaveProperty('native_erased', true);
}, 45000);
it('rejects completion after reservation release and maintenance clears the cancelled proof', async () => {
  const { reserveFixture } = await import('./helpers/fixtures');
  const { confirmProof } = await import('@/features/accounts/email-protocol');
  const f = await reserveFixture('program_head');
  const generated = await admin.auth.admin.generateLink({ type: 'invite', email: f.email });
  expect(Boolean(generated.error)).toBe(false);
  const id = generated.data.user!.id;
  const queued = await admin.rpc('queue_generated_auth_email', {
    target_id: id,
    recipient: f.email,
    native_type: 'invite',
    native_verifier: generated.data.properties!.hashed_token,
  });
  expect(Boolean(queued.error)).toBe(false);
  const p = await inspect(id);
  const cap = capability();
  const proof = await confirmProof(admin, anonymous(), p.challenge, cap);
  const applying = await admin.rpc('advance_email_operation', {
    proof_id: proof.operationId,
    capability_hash: cap,
    step: 'apply',
    full_name: 'Synthetic holder',
  });
  expect(Boolean(applying.error)).toBe(false);
  const updated = await admin.auth.admin.updateUserById(id, {
    password: 'Cancelled synthetic holder passphrase',
    app_metadata: { password_operation_id: applying.data.operation_id },
  });
  expect(Boolean(updated.error)).toBe(false);
  await inspect(id, 'release_reservation');
  const finished = await admin.rpc('advance_email_operation', {
    proof_id: proof.operationId,
    capability_hash: cap,
    step: 'finish',
  });
  expect(Boolean(finished.error)).toBe(true);
  expect(Boolean((await admin.rpc('reconcile_auth_mail')).error)).toBe(false);
  expect(await inspect(id)).toMatchObject({
    state: 'failed',
    native_erased: true,
    delivery_erased: true,
  });
}, 45000);
it('finishes a committed holder password update after its response is lost', async () => {
  const { reserveFixture } = await import('./helpers/fixtures');
  const { confirmProof, finishInvitation } = await import('@/features/accounts/email-protocol');
  const f = await reserveFixture('program_head');
  const g = await admin.auth.admin.generateLink({
    type: 'invite',
    email: f.email,
    options: { data: { full_name: 'Synthetic integration fixture' } },
  });
  expect(Boolean(g.error)).toBe(false);
  const id = g.data.user!.id;
  await admin.rpc('queue_generated_auth_email', {
    target_id: id,
    recipient: f.email,
    native_type: 'invite',
    native_verifier: g.data.properties!.hashed_token,
  });
  const p = await inspect(id);
  const cap = capability();
  const operation = await confirmProof(admin, anonymous(), p.challenge, cap);
  const update = admin.auth.admin.updateUserById.bind(admin.auth.admin);
  const client = Object.create(admin);
  client.auth = {
    ...admin.auth,
    admin: {
      ...admin.auth.admin,
      getUserById: admin.auth.admin.getUserById.bind(admin.auth.admin),
      updateUserById: async (userId: string, attributes: Record<string, unknown>) => {
        const result = await update(userId, attributes);
        if (attributes.password && !result.error) throw Error('simulated lost response');
        return result;
      },
    },
  };
  await expect(
    finishInvitation(client, operation.operationId, cap, {
      fullName: 'Synthetic holder',
      password: 'Holder chosen secret passphrase',
    })
  ).resolves.toEqual({ complete: true });
}, 45000);
it('cancels a stale applying operation and fences a late chosen-password write', async () => {
  const { reserveFixture } = await import('./helpers/fixtures');
  const { confirmProof } = await import('@/features/accounts/email-protocol');
  const f = await reserveFixture('program_head');
  const g = await admin.auth.admin.generateLink({
    type: 'invite',
    email: f.email,
    options: { data: { full_name: 'Synthetic integration fixture' } },
  });
  expect(Boolean(g.error)).toBe(false);
  const id = g.data.user!.id;
  await admin.rpc('queue_generated_auth_email', {
    target_id: id,
    recipient: f.email,
    native_type: 'invite',
    native_verifier: g.data.properties!.hashed_token,
  });
  const p = await inspect(id);
  const cap = capability();
  const proof = await confirmProof(admin, anonymous(), p.challenge, cap);
  const applying = await admin.rpc('advance_email_operation', {
    proof_id: proof.operationId,
    capability_hash: cap,
    step: 'apply',
    full_name: 'Synthetic holder',
  });
  expect(Boolean(applying.error)).toBe(false);
  await inspect(id, 'age_operation');
  expect(Boolean((await admin.rpc('reconcile_auth_mail')).error)).toBe(false);
  const late = await admin.auth.admin.updateUserById(id, {
    password: 'Late holder chosen passphrase',
    app_metadata: { password_operation_id: applying.data.operation_id },
  });
  expect(Boolean(late.error)).toBe(true);
  expect(await inspect(id)).toHaveProperty('state', 'failed');
}, 45000);
it('maintenance finalizes an Auth-applied password without retaining or replaying the password', async () => {
  const { reserveFixture } = await import('./helpers/fixtures');
  const { confirmProof } = await import('@/features/accounts/email-protocol');
  const f = await reserveFixture('program_head');
  const g = await admin.auth.admin.generateLink({
    type: 'invite',
    email: f.email,
    options: { data: { full_name: 'Synthetic integration fixture' } },
  });
  expect(Boolean(g.error)).toBe(false);
  const id = g.data.user!.id;
  await admin.rpc('queue_generated_auth_email', {
    target_id: id,
    recipient: f.email,
    native_type: 'invite',
    native_verifier: g.data.properties!.hashed_token,
  });
  const p = await inspect(id);
  const cap = capability();
  const proof = await confirmProof(admin, anonymous(), p.challenge, cap);
  const applying = await admin.rpc('apply_invitation_details', {
    proof_id: proof.operationId,
    capability_hash: cap,
    employee_number: '000-RECONCILED',
    full_name: 'Synthetic holder',
  });
  expect(Boolean(applying.error)).toBe(false);
  const result = await admin.auth.admin.updateUserById(id, {
    password: 'A committed holder passphrase',
    app_metadata: { password_operation_id: applying.data.operation_id },
  });
  expect(Boolean(result.error)).toBe(false);
  expect(Boolean((await admin.rpc('reconcile_auth_mail')).error)).toBe(false);
  expect(await inspect(id)).toMatchObject({ state: 'complete', employee_number: '000-RECONCILED' });
}, 45000);
it('can reissue the native invitation after an interrupted verified setup', async () => {
  const { reserveFixture } = await import('./helpers/fixtures');
  const { confirmProof } = await import('@/features/accounts/email-protocol');
  const f = await reserveFixture('program_head');
  const g = await admin.auth.admin.generateLink({
    type: 'invite',
    email: f.email,
    options: { data: { full_name: 'Synthetic integration fixture' } },
  });
  expect(Boolean(g.error)).toBe(false);
  const id = g.data.user!.id;
  await admin.rpc('queue_generated_auth_email', {
    target_id: id,
    recipient: f.email,
    native_type: 'invite',
    native_verifier: g.data.properties!.hashed_token,
  });
  const p = await inspect(id);
  await confirmProof(admin, anonymous(), p.challenge, capability());
  await inspect(id, 'expire');
  await admin.rpc('reconcile_auth_mail');
  const again = await admin.auth.admin.generateLink({ type: 'invite', email: f.email });
  expect(again.error?.code).toBe('email_exists');
  await inspect(id, 'age_latest');
  const hook = await admin.rpc('test_email_fixture', {
    action: 'hook_recovery',
    run_id: runId,
    args: { project_ref: testProjectRef, account_id: id },
  });
  expect(Boolean(hook.error)).toBe(true);
  const resumed = await admin.auth.admin.generateLink({ type: 'recovery', email: f.email });
  expect(Boolean(resumed.error)).toBe(false);
  const queued = await admin.rpc('queue_generated_auth_email', {
    target_id: id,
    recipient: f.email,
    native_type: 'recovery',
    native_verifier: resumed.data.properties!.hashed_token,
  });
  expect(Boolean(queued.error)).toBe(false);
  const replacement = await inspect(id);
  const cap = capability();
  const native = anonymous();
  const { actor } = await import('./helpers/fixtures');
  const signOut = native.auth.signOut.bind(native.auth);
  native.auth.signOut = async (options) => {
    expect(await actor(native)).toEqual([]);
    return signOut(options);
  };
  const op = await confirmProof(admin, native, replacement.challenge, cap);
  const { finishInvitation } = await import('@/features/accounts/email-protocol');
  await expect(
    finishInvitation(admin, op.operationId, cap, {
      fullName: 'Synthetic resumed holder',
      password: 'Resumed holder passphrase',
    })
  ).resolves.toEqual({ complete: true });
  expect(
    Boolean(
      (
        await admin.rpc('claim_email_challenge', {
          challenge_hash: hash(p.challenge),
          capability_hash: capability(),
        })
      ).error
    )
  ).toBe(true);
}, 45000);
it('resumes one bootstrap and commits one real Administrator approval despite mail failure', async () => {
  const { fixturePassword, signIn } = await import('./helpers/fixtures');
  const { confirmProof, finishInvitation } = await import('@/features/accounts/email-protocol');
  const manifestHash = hash(runId);
  const administratorEmail = `fixture-${runId.slice(0, 8)}-bootstrap@example.com`;
  const args = {
    project_ref: testProjectRef,
    manifest_hash: manifestHash,
    email: administratorEmail,
    full_name: 'Synthetic integration fixture',
  };
  const first = await admin.rpc('bootstrap_demo_administrator', args);
  expect(first.error?.code ?? null).toBe(null);
  await harness('adopt', { reservation_id: first.data.reservation_id });
  expect((await admin.rpc('bootstrap_demo_administrator', args)).data.reservation_id).toBe(
    first.data.reservation_id
  );
  expect(
    Boolean(
      (await admin.rpc('bootstrap_demo_administrator', { ...args, manifest_hash: 'b'.repeat(64) }))
        .error
    )
  ).toBe(true);
  expect(
    Boolean(
      (
        await admin.rpc('bootstrap_demo_administrator', {
          ...args,
          email: `fixture-${runId.slice(0, 8)}-other@example.com`,
        })
      ).error
    )
  ).toBe(true);
  const link = await admin.auth.admin.generateLink({
    type: 'invite',
    email: administratorEmail,
    options: { data: { full_name: 'Synthetic integration fixture' } },
  });
  expect(Boolean(link.error)).toBe(false);
  const administratorId = link.data.user!.id;
  await admin.rpc('queue_generated_auth_email', {
    target_id: administratorId,
    recipient: administratorEmail,
    native_type: 'invite',
    native_verifier: link.data.properties!.hashed_token,
  });
  const p = await inspect(administratorId);
  const cap = capability();
  const operation = await confirmProof(admin, anonymous(), p.challenge, cap);
  await finishInvitation(admin, operation.operationId, cap, {
    fullName: 'Synthetic Administrator',
    password: fixturePassword,
  });
  const { client } = await signIn({ email: administratorEmail });
  expect(
    Boolean(
      (
        await client.rpc('approve_demo_application', {
          project_ref: testProjectRef,
          target_id: administratorId,
          reason: 'Self approval attempt',
        })
      ).error
    )
  ).toBe(true);
  const email = `fixture-${runId.slice(0, 8)}-application@example.com`;
  const reserved = await client.rpc('reserve_demo_application', {
    project_ref: testProjectRef,
    manifest_hash: manifestHash,
    slot: 'faculty_1',
    email,
    full_name: 'Synthetic integration fixture',
  });
  expect(reserved.error?.code ?? null).toBe(null);
  await harness('adopt', { reservation_id: reserved.data.reservation_id });
  const created = await admin.auth.admin.createUser({
    email,
    password: fixturePassword,
    email_confirm: false,
    app_metadata: { account_reservation_id: reserved.data.reservation_id },
  });
  expect(Boolean(created.error)).toBe(false);
  const id = created.data.user!.id;
  const verification = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password: fixturePassword,
  });
  expect(verification.error?.code ?? null).toBe(null);
  await admin.rpc('queue_generated_auth_email', {
    target_id: id,
    recipient: email,
    native_type: 'signup',
    native_verifier: verification.data.properties!.hashed_token,
  });
  const vp = await inspect(id);
  await confirmProof(admin, anonymous(), vp.challenge, capability());
  const decision = {
    project_ref: testProjectRef,
    target_id: id,
    reason: 'Synthetic fixture; no school evidence asserted.',
  };
  expect((await client.rpc('approve_demo_application', decision)).data).toEqual({ approved: true });
  expect((await client.rpc('approve_demo_application', decision)).data).toEqual({ approved: true });
  const claimed = await admin.rpc('claim_mail_work', { batch_size: 20 });
  expect(Boolean(claimed.error)).toBe(false);
  for (const job of claimed.data)
    await admin.rpc('finish_mail_work', {
      work_id: job.id,
      claim_id: job.lease_id,
      delivered: false,
    });
  expect(await harness('inspect', { account_id: id })).toHaveProperty('status', 'approved');
  expect(await inspect(id, 'decision_counts')).toEqual({
    decisions: 1,
    notices: 1,
    mail_state: 'pending',
    attempts: 1,
  });
  const setupStatus = async (slot = 'faculty_1') => {
    const result = await admin.rpc('demo_setup_status', {
      project_ref: testProjectRef,
      manifest_hash: manifestHash,
    });
    expect(Boolean(result.error)).toBe(false);
    return result.data.find((row: { slot: string }) => row.slot === slot);
  };
  expect(await setupStatus()).toHaveProperty('approval_mail_state', 'pending');
  await inspect(id, 'retry_notice');
  const retry = await admin.rpc('claim_mail_work', { batch_size: 20 });
  const notice = retry.data.find((job: { recipient: string }) => job.recipient === email);
  expect(notice).toBeTruthy();
  expect(
    (await admin.rpc('prepare_mail_work', { work_id: notice.id, claim_id: notice.lease_id })).data
  ).toBe(true);
  await admin.rpc('finish_mail_work', {
    work_id: notice.id,
    claim_id: notice.lease_id,
    delivered: true,
  });
  expect(await setupStatus()).toHaveProperty('approval_mail_state', 'sent');
  expect(await inspect(id, 'decision_counts')).toEqual({
    decisions: 1,
    notices: 1,
    mail_state: 'sent',
    attempts: 2,
  });
  for (let attempt = 2; attempt <= 5; attempt++) {
    await inspect(administratorId, 'retry_notice');
    const batch = await admin.rpc('claim_mail_work', { batch_size: 20 });
    const adminNotice = batch.data.find(
      (job: { recipient: string }) => job.recipient === administratorEmail
    );
    expect(adminNotice).toBeTruthy();
    await admin.rpc('finish_mail_work', {
      work_id: adminNotice.id,
      claim_id: adminNotice.lease_id,
      delivered: false,
    });
  }
  expect(await setupStatus('administrator')).toHaveProperty('approval_mail_state', 'failed');
  const { actor } = await import('./helpers/fixtures');
  expect(await actor((await signIn({ email })).client)).toHaveLength(1);
  await harness('state', { account_id: id, active: false });
  const status = await admin.rpc('demo_setup_status', {
    project_ref: testProjectRef,
    manifest_hash: manifestHash,
  });
  expect(status.data.find((row: { slot: string }) => row.slot === 'faculty_1')).toHaveProperty(
    'active',
    false
  );
}, 45000);
it('serializes concurrent proof claims to one browser capability', async () => {
  const f = await proofFixture();
  const p = await inspect(f.id);
  const claims = await Promise.all(
    [capability(), capability()].map((cap) =>
      admin.rpc('claim_email_challenge', {
        challenge_hash: hash(p.challenge),
        capability_hash: cap,
      })
    )
  );
  expect(claims.filter((r) => !r.error)).toHaveLength(1);
});
it('rejects a cancelled old native invite after a fresh verifier and marker are staged', async () => {
  const { reserveFixture } = await import('./helpers/fixtures');
  const f = await reserveFixture('program_head');
  const old = await admin.auth.admin.generateLink({
    type: 'invite',
    email: f.email,
    options: { data: { full_name: 'Synthetic integration fixture' } },
  });
  expect(Boolean(old.error)).toBe(false);
  const id = old.data.user!.id;
  await admin.rpc('queue_generated_auth_email', {
    target_id: id,
    recipient: f.email,
    native_type: 'invite',
    native_verifier: old.data.properties!.hashed_token,
  });
  const first = await inspect(id);
  const firstCap = capability();
  const claimed = await admin.rpc('claim_email_challenge', {
    challenge_hash: hash(first.challenge),
    capability_hash: firstCap,
  });
  expect(Boolean(claimed.error)).toBe(false);
  await admin.auth.admin.updateUserById(id, {
    app_metadata: { password_operation_id: claimed.data.operation_id },
  });
  await inspect(id, 'age_operation');
  await admin.rpc('reconcile_auth_mail');
  await inspect(id, 'age_latest');
  const fresh = await admin.auth.admin.generateLink({ type: 'invite', email: f.email });
  expect(Boolean(fresh.error)).toBe(false);
  await admin.rpc('queue_generated_auth_email', {
    target_id: id,
    recipient: f.email,
    native_type: 'invite',
    native_verifier: fresh.data.properties!.hashed_token,
  });
  const second = await inspect(id);
  const nextCap = capability();
  const next = await admin.rpc('claim_email_challenge', {
    challenge_hash: hash(second.challenge),
    capability_hash: nextCap,
  });
  expect(Boolean(next.error)).toBe(false);
  await admin.auth.admin.updateUserById(id, {
    app_metadata: { password_operation_id: next.data.operation_id },
  });
  const late = await anonymous().auth.verifyOtp({
    type: 'invite',
    token_hash: old.data.properties!.hashed_token,
  });
  expect(Boolean(late.error)).toBe(true);
  const valid = await anonymous().auth.verifyOtp({
    type: 'invite',
    token_hash: fresh.data.properties!.hashed_token,
  });
  expect(Boolean(valid.error)).toBe(false);
  expect(
    (
      await admin.rpc('advance_email_operation', {
        proof_id: second.id,
        capability_hash: nextCap,
        step: 'inspect',
      })
    ).data.operation_state
  ).toBe('auth_applied');
  expect(
    Boolean(
      (
        await admin.rpc('claim_email_challenge', {
          challenge_hash: hash(first.challenge),
          capability_hash: firstCap,
        })
      ).error
    )
  ).toBe(true);
}, 45000);
it('serializes cancellation racing a native chosen-password commit', async () => {
  const { reserveFixture } = await import('./helpers/fixtures');
  const { confirmProof } = await import('@/features/accounts/email-protocol');
  const f = await reserveFixture('program_head');
  const g = await admin.auth.admin.generateLink({
    type: 'invite',
    email: f.email,
    options: { data: { full_name: 'Synthetic integration fixture' } },
  });
  expect(Boolean(g.error)).toBe(false);
  const id = g.data.user!.id;
  await admin.rpc('queue_generated_auth_email', {
    target_id: id,
    recipient: f.email,
    native_type: 'invite',
    native_verifier: g.data.properties!.hashed_token,
  });
  const p = await inspect(id);
  const cap = capability();
  const proof = await confirmProof(admin, anonymous(), p.challenge, cap);
  const applying = await admin.rpc('advance_email_operation', {
    proof_id: proof.operationId,
    capability_hash: cap,
    step: 'apply',
    full_name: 'Synthetic racing holder',
  });
  expect(Boolean(applying.error)).toBe(false);
  await inspect(id, 'age_operation');
  const [write, cancel] = await Promise.all([
    admin.auth.admin.updateUserById(id, {
      password: 'Racing holder chosen passphrase',
      app_metadata: { password_operation_id: applying.data.operation_id },
    }),
    admin.rpc('reconcile_auth_mail'),
  ]);
  expect(Boolean(cancel.error)).toBe(false);
  await admin.rpc('reconcile_auth_mail');
  expect(await inspect(id)).toHaveProperty('state', write.error ? 'failed' : 'complete');
}, 45000);
