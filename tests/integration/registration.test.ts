// @vitest-environment node
import { randomBytes, randomUUID } from 'node:crypto';
import { AsyncLocalStorage } from 'node:async_hooks';
import { mkdir } from 'node:fs/promises';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import {
  admin,
  anonymous,
  cleanFixtures,
  harness,
  runId,
  testProjectRef,
  signIn,
  actor,
  createFixture,
} from './helpers/fixtures';
import { assertNativeMailTestReady } from './helpers/mail-safety';
import { saveFixtureJournal } from './helpers/fixture-journal.mjs';
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: async () => jar.getStore(),
  headers: async () =>
    new Headers({
      origin: 'https://example.test',
      'x-cs-proxy': 'synthetic-proxy-secret-32-characters',
      'x-cs-ip': sourceIp,
    }),
}));
vi.mock('@/config/env', () => ({
  getAppEnv: () => ({
    appOrigin: new URL('https://example.test'),
    supabaseUrl: process.env.TEST_SUPABASE_URL,
  }),
  getAdminEnv: () => ({ secretKey: process.env.TEST_SUPABASE_SECRET_KEY }),
}));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => admin }));
import { registerAccount, resendVerification } from '@/features/accounts/registration';
import { confirmProof, proofHash } from '@/features/accounts/email-protocol';
const sourceIp = `2001:db8:${randomUUID().slice(0, 4)}:${randomUUID().slice(0, 4)}::1`;
const jar = new AsyncLocalStorage<ReturnType<typeof browser>>();
function browser() {
  const values = new Map<string, string>();
  return {
    values,
    get: (key: string) => (values.has(key) ? { value: values.get(key)! } : undefined),
    set: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
const attemptedEmails = new Set<string>();
const passwords = new Map<string, string>();
beforeEach(() => {
  // Native resend has a shared hosted quota; this substitutes transport, not the DB proof protocol.
  vi.spyOn(admin.auth, 'resend').mockImplementation(async (attributes) => {
    if (attributes.type !== 'signup' || !('email' in attributes))
      throw new Error('Unsupported test mail');
    const generated = await admin.auth.admin.generateLink({
      type: 'signup',
      email: attributes.email,
      password: passwords.get(attributes.email)!,
    });
    if (generated.error) throw new Error(`Test proof generation failed (${generated.error.code})`);
    const queued = await admin.rpc('queue_generated_auth_email', {
      target_id: generated.data.user.id,
      recipient: attributes.email,
      native_type: 'signup',
      native_verifier: generated.data.properties.hashed_token,
    });
    if (queued.error) throw new Error(`Test proof queue failed (${queued.error.code})`);
    return { data: { user: null, session: null }, error: null };
  });
});
beforeAll(async () => {
  assertNativeMailTestReady();
  vi.stubEnv('APP_ORIGIN', 'https://example.test');
  vi.stubEnv('LOCAL_PROXY_SECRET', 'synthetic-proxy-secret-32-characters');
  vi.stubEnv('AUTH_PASSWORD_GATE_VERIFIED_PROJECT_REF', testProjectRef);
  await mkdir('tests/integration/.artifacts', { recursive: true });
  await saveFixtureJournal(`tests/integration/.artifacts/${runId}.json`, {
    projectRef: testProjectRef,
    runId,
    accountIds: [],
  });
});
afterEach(async () => {
  vi.restoreAllMocks();
  for (const email of attemptedEmails) await harness('adopt_registration', { email });
});
afterAll(cleanFixtures, 30000);
const args = () => ({
  capability_hash: randomBytes(32).toString('hex'),
  email: `fixture-${runId}-${randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`,
  role: 'student',
  full_name: 'Synthetic public applicant',
  student_number: `000${randomUUID()}`,
  employee_number: null,
});
function input(role = 'student') {
  const row = args();
  const email =
    role === 'student' ? row.email : row.email.replace('caloocan.sti.edu.ph', 'example.org');
  attemptedEmails.add(email);
  passwords.set(email, '😀'.repeat(18));
  return {
    role,
    fullName: row.full_name,
    email,
    studentNumber: row.student_number,
    employeeNumber: '00042',
    password: '😀'.repeat(18),
  };
}
async function inspect(email: string) {
  return harness('adopt_registration', { email });
}
test('creates an unconfirmed Student with leading zeros, then proof still grants no ordinary access', async () => {
  const application = input();
  expect(await jar.run(browser(), () => registerAccount(application))).toEqual({
    ok: true,
    code: 'accepted',
    verification: 'queued',
  });
  const saved = await inspect(application.email);
  expect(saved).toMatchObject({
    student_number: application.studentNumber,
    application_status: 'pending',
    active: true,
  });
  const user = await admin.auth.admin.getUserById(saved.account_id);
  expect(user.data.user?.email_confirmed_at).toBeFalsy();
  expect((await anonymous().auth.signInWithPassword(application)).error?.code).toBe(
    'email_not_confirmed'
  );
  const proof = await admin.rpc('test_email_fixture', {
    action: 'inspect',
    run_id: runId,
    args: { project_ref: testProjectRef, account_id: saved.account_id },
  });
  expect(proof.data?.lifetime_seconds).toBe(1800);
  const proofClient = anonymous();
  await confirmProof(admin, proofClient, proof.data.challenge, proofHash(randomUUID()));
  expect((await proofClient.rpc('current_actor')).status).toBe(401);
  const signed = await signIn(application, application.password);
  expect(await actor(signed.client)).toMatchObject([
    { application_status: 'pending', role: 'student' },
  ]);
  expect(
    (await signed.client.from('accounts').select('id,role,application_status,active')).data
  ).toEqual([]);
  expect(
    (await signed.client.rpc('create_course_draft', { course_id: randomUUID(), details: {} })).error
      ?.code
  ).toBe('PT401');
});
test('accepts non-Gmail Faculty and the exact 12-code-point password boundary', async () => {
  const application = { ...input('faculty'), password: '😀'.repeat(12) };
  passwords.set(application.email, application.password);
  const session = browser();
  expect(await jar.run(session, () => registerAccount(application))).toEqual({
    ok: true,
    code: 'accepted',
    verification: 'queued',
  });
  expect(await inspect(application.email)).toMatchObject({
    role: 'faculty',
    employee_number: '00042',
    student_number: null,
    application_status: 'pending',
  });
  expect(session.values.get('__Host-registration')).toBe('');
});
test('concurrent duplicate applications create only one account and reserve the original identity', async () => {
  const application = input();
  const results = await Promise.all([
    jar.run(browser(), () => registerAccount(application)),
    jar.run(browser(), () => registerAccount({ ...application, fullName: 'Impostor' })),
  ]);
  expect(results).toEqual(
    expect.arrayContaining([
      { ok: true, code: 'accepted', verification: 'queued' },
      { ok: true, code: 'accepted', verification: 'undisclosed' },
    ])
  );
  const saved = await inspect(application.email);
  expect(saved.account_id).toEqual(expect.any(String));
  expect(saved.account_count).toBe(1);
});
test('resolves a dropped creation response without overwriting the identity or password', async () => {
  const application = input();
  const create = admin.auth.admin.createUser.bind(admin.auth.admin);
  vi.spyOn(admin.auth.admin, 'createUser').mockImplementationOnce(async (attributes) => {
    await create(attributes);
    throw new Error('Response lost');
  });
  expect(await jar.run(browser(), () => registerAccount(application))).toEqual({
    ok: true,
    code: 'accepted',
    verification: 'queued',
  });
  expect((await inspect(application.email)).account_count).toBe(1);
});
test('a later retry resolves an uncertain committed account and preserves its original password', async () => {
  const application = input();
  const session = browser();
  const create = admin.auth.admin.createUser.bind(admin.auth.admin);
  const rpc = admin.rpc.bind(admin);
  let dropLookup = false;
  vi.spyOn(admin, 'rpc').mockImplementation((name, parameters) => {
    if (name === 'reserve_registration' && dropLookup) {
      dropLookup = false;
      throw new Error('Resolution response lost');
    }
    return rpc(name, parameters);
  });
  vi.spyOn(admin.auth.admin, 'createUser').mockImplementationOnce(async (attributes) => {
    const created = await create(attributes);
    if (created.error) throw created.error;
    dropLookup = true;
    throw new Error('Creation response lost');
  });
  expect(await jar.run(session, () => registerAccount(application))).toEqual({
    ok: false,
    code: 'unavailable',
  });
  expect(
    await jar.run(session, () =>
      registerAccount({ ...application, password: 'Different password 123' })
    )
  ).toEqual({ ok: true, code: 'accepted', verification: 'queued' });
  const saved = await inspect(application.email);
  const proof = await admin.rpc('test_email_fixture', {
    action: 'inspect',
    run_id: runId,
    args: { project_ref: testProjectRef, account_id: saved.account_id },
  });
  await confirmProof(admin, anonymous(), proof.data.challenge, proofHash(randomUUID()));
  expect((await anonymous().auth.signInWithPassword(application)).error).toBeNull();
  expect(
    (
      await anonymous().auth.signInWithPassword({
        email: application.email,
        password: 'Different password 123',
      })
    ).error?.code
  ).toBe('invalid_credentials');
  expect(saved.account_count).toBe(1);
});
test('a settled browser can register a different applicant with a fresh capability', async () => {
  const session = browser();
  for (const application of [input(), input('faculty')]) {
    expect(await jar.run(session, () => registerAccount(application))).toEqual({
      ok: true,
      code: 'accepted',
      verification: 'queued',
    });
    expect(session.values.get('__Host-registration')).toBe('');
  }
});
test.runIf(process.env.TEST_NATIVE_REGISTRATION_MAIL === '1')(
  'native resend invokes the configured hosted email hook',
  async () => {
    vi.restoreAllMocks();
    const application = input();
    expect(await jar.run(browser(), () => registerAccount(application))).toEqual({
      ok: true,
      code: 'accepted',
      verification: 'queued',
    });
    const saved = await inspect(application.email);
    const proof = await admin.rpc('test_email_fixture', {
      action: 'inspect',
      run_id: runId,
      args: { project_ref: testProjectRef, account_id: saved.account_id },
    });
    expect(proof.data).toMatchObject({ lifetime_seconds: 1800, state: 'issued' });
    expect(
      (await admin.auth.admin.getUserById(saved.account_id)).data.user?.email_confirmed_at
    ).toBeFalsy();
  }
);
test('creation and mail failure retain the capability; changed identity cannot hijack a retry', async () => {
  const application = input();
  const session = browser();
  vi.spyOn(admin.auth.admin, 'createUser').mockRejectedValueOnce(new Error('Provider unavailable'));
  expect(await jar.run(session, () => registerAccount(application))).toEqual({
    ok: false,
    code: 'unavailable',
  });
  expect(
    await jar.run(session, () => registerAccount({ ...application, fullName: 'Changed identity' }))
  ).toEqual({ ok: false, code: 'unavailable' });
  vi.spyOn(admin.auth, 'resend').mockRejectedValueOnce(new Error('Hook unavailable'));
  expect(await jar.run(session, () => registerAccount(application))).toEqual({
    ok: false,
    code: 'unavailable',
  });
  const saved = await inspect(application.email);
  expect(saved.application_status).toBe('pending');
  expect(
    (await admin.auth.admin.getUserById(saved.account_id)).data.user?.email_confirmed_at
  ).toBeFalsy();
  expect(
    await jar.run(session, () =>
      registerAccount({ ...application, password: 'Changed password 12345' })
    )
  ).toEqual({ ok: false, code: 'throttled' });
  const proof = await admin.auth.admin.generateLink({
    type: 'signup',
    email: application.email,
    password: application.password,
  });
  expect(proof.error).toBeNull();
  await anonymous().auth.verifyOtp({
    type: 'signup',
    token_hash: proof.data.properties!.hashed_token,
  });
  expect((await anonymous().auth.signInWithPassword(application)).error).toBeNull();
  expect(
    (
      await anonymous().auth.signInWithPassword({
        email: application.email,
        password: 'Changed password 12345',
      })
    ).error
  ).toBeTruthy();
});
test.each(['pending', 'rejected', 'deactivated'])(
  'keeps identifiers reserved for %s accounts',
  async (state) => {
    const existing = await createFixture();
    if (state === 'rejected')
      await harness('state', { account_id: existing.id, status: 'rejected' });
    if (state === 'deactivated') await harness('state', { account_id: existing.id, active: false });
    expect(
      await jar.run(browser(), () => registerAccount({ ...input(), email: existing.email }))
    ).toEqual({ ok: true, code: 'accepted', verification: 'undisclosed' });
    expect(
      await jar.run(browser(), () =>
        registerAccount({ ...input(), studentNumber: existing.studentNumber })
      )
    ).toEqual({ ok: true, code: 'accepted', verification: 'undisclosed' });
  }
);
test('resend acknowledges unknown and ineligible addresses equally and throttles repeated requests', async () => {
  const unknown = input('faculty').email;
  const rejected = await createFixture('faculty');
  await harness('state', { account_id: rejected.id, status: 'rejected' });
  for (const email of [unknown, rejected.email]) {
    expect(await resendVerification(email)).toEqual({ ok: true, code: 'acknowledged' });
    expect(await resendVerification(` ${email.toUpperCase()} `)).toEqual({
      ok: false,
      code: 'throttled',
    });
  }
});
test('public reservation binds normalized identity and rejects privileged role requests', async () => {
  const input = args();
  const reserved = await admin.rpc('reserve_registration', input);
  expect(reserved.error).toBeNull();
  expect(reserved.data?.reservation_id).toEqual(expect.any(String));
  await harness('adopt', { reservation_id: reserved.data.reservation_id });
  const replay = await admin.rpc('reserve_registration', {
    ...input,
    email: ` ${input.email.toUpperCase()} `,
  });
  expect(replay.data).toEqual(reserved.data);
  const changed = await admin.rpc('reserve_registration', {
    ...input,
    full_name: 'Different person',
  });
  expect(changed.error).toBeTruthy();
  const elevated = await admin.rpc('reserve_registration', { ...args(), role: 'administrator' });
  expect(elevated.error).toBeTruthy();
});
test('unknown addresses receive at most five verification requests per rolling hour', async () => {
  const email = input('faculty').email;
  for (let request = 0; request < 5; request++) {
    expect(await resendVerification(email)).toEqual({ ok: true, code: 'acknowledged' });
    await harness('age_verification_requests', { email });
  }
  expect(await resendVerification(email)).toEqual({ ok: false, code: 'throttled' });
});
test('unverified email-hook configuration fails closed for public resend', async () => {
  vi.stubEnv('AUTH_MAIL_HOOK_VERIFIED_PROJECT_REF', '');
  try {
    expect(await resendVerification(input('faculty').email)).toEqual({
      ok: false,
      code: 'unavailable',
    });
  } finally {
    vi.stubEnv('AUTH_MAIL_HOOK_VERIFIED_PROJECT_REF', testProjectRef);
  }
});
test('an interrupted request is recovered from the durable run namespace before adoption', async () => {
  const application = args();
  const reserved = await admin.rpc('reserve_registration', application);
  expect(reserved.error).toBeNull();
  const created = await admin.auth.admin.createUser({
    email: application.email,
    password: 'Synthetic recovery 123',
    email_confirm: false,
    app_metadata: { account_reservation_id: reserved.data.reservation_id },
  });
  expect(created.error).toBeNull();
  const otherRun = await admin.rpc('test_account_fixture', {
    action: 'cleanup_ids',
    run_id: randomUUID(),
    args: { project_ref: testProjectRef },
  });
  expect(otherRun.data).not.toContain(created.data.user!.id);
  expect(await harness('cleanup_ids')).toContain(created.data.user!.id);
});
test('authenticated applicants cannot invoke public reservation or resend-admission RPCs directly', async () => {
  const account = await createFixture();
  const signed = await signIn(account);
  expect((await signed.client.rpc('reserve_registration', args())).error?.code).toBe('42501');
  expect(
    (await signed.client.rpc('request_registration_verification', { email: account.email })).error
      ?.code
  ).toBe('42501');
});
test('expired uncreated registration can be reclaimed while its old capability and native creation fail closed', async () => {
  const original = args();
  const first = await admin.rpc('reserve_registration', original);
  expect(first.error).toBeNull();
  await harness('expire_registration', { email: original.email });
  const replacement = { ...original, capability_hash: randomBytes(32).toString('hex') };
  const [reclaimed, stale] = await Promise.all([
    admin.rpc('reserve_registration', replacement),
    admin.auth.admin.createUser({
      email: original.email,
      password: 'Expired attempt 123',
      email_confirm: false,
      app_metadata: { account_reservation_id: first.data.reservation_id },
    }),
  ]);
  expect(stale.error).toBeTruthy();
  expect(reclaimed.error).toBeNull();
  expect(reclaimed.data?.reservation_id).toEqual(expect.any(String));
  expect(reclaimed.data.reservation_id).not.toBe(first.data.reservation_id);
  expect((await admin.rpc('reserve_registration', original)).error?.code).toBe('23514');
  const created = await admin.auth.admin.createUser({
    email: original.email,
    password: 'Current attempt 123',
    email_confirm: false,
    app_metadata: { account_reservation_id: reclaimed.data.reservation_id },
  });
  expect(created.error).toBeNull();
  expect((await inspect(original.email)).account_count).toBe(1);
});
test('expiration never releases a consumed public reservation', async () => {
  const application = input();
  expect(await jar.run(browser(), () => registerAccount(application))).toMatchObject({ ok: true });
  const saved = await inspect(application.email);
  await harness('expire_registration', { email: application.email });
  const retry = await admin.rpc('reserve_registration', { ...args(), email: application.email });
  expect(retry.error).toBeNull();
  expect(retry.data).toBeNull();
  expect((await inspect(application.email)).account_id).toBe(saved.account_id);
});
