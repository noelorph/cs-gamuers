import { randomUUID } from 'node:crypto';
import { mkdir, unlink } from 'node:fs/promises';
import { loadEnvFile } from 'node:process';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { userTransport } from '../../../src/lib/supabase/user-transport.mjs';
import { assertIsolatedTestTarget } from './environment';
import { saveFixtureJournal } from './fixture-journal.mjs';

try {
  loadEnvFile('.env.local');
} catch {
  /* CI supplies environment directly. */
}
assertIsolatedTestTarget();
export const testProjectRef = 'ggiccvcrkydcimveyrfi';
if (process.env.TEST_SUPABASE_PROJECT_REF !== testProjectRef)
  throw new Error('Unapproved integration target');
const url = process.env.TEST_SUPABASE_URL!;
const secret = process.env.TEST_SUPABASE_SECRET_KEY;
if (!secret) throw new Error('Missing isolated test credentials');
const options = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
};
export const admin = createClient(url, secret, options);
export const anonymous = () =>
  createClient(url, secret, { ...options, global: { fetch: userTransport(url, secret) } });
export const runId = randomUUID();
export const fixturePassword = `Fixture ${randomUUID()}`;
const ownedIds = new Set<string>();

export async function harness(action: string, args: Record<string, unknown> = {}) {
  const result = await admin.rpc('test_account_fixture', {
    action,
    run_id: runId,
    args: { project_ref: testProjectRef, ...args },
  });
  if (result.error) throw new Error(`Fixture ${action} failed (${result.error.code})`);
  return result.data;
}

export async function reserveFixture(
  role = 'student',
  domain = 'caloocan.sti.edu.ph',
  studentNumber = randomUUID()
) {
  const email = `fixture-${runId.slice(0, 8)}-${randomUUID().slice(0, 8)}@${domain}`;
  const reserved = await harness('reserve', { email, role, student_number: studentNumber });
  return { email, role, studentNumber, reservationId: reserved.reservation_id as string };
}

export async function createFixture(role = 'student', confirmed = true, passwordHash?: string) {
  const reservation = await reserveFixture(role);
  const result = await admin.auth.admin.createUser({
    email: reservation.email,
    ...(passwordHash ? { password_hash: passwordHash } : { password: fixturePassword }),
    email_confirm: confirmed,
    app_metadata: { account_reservation_id: reservation.reservationId },
    user_metadata: {
      role,
      full_name: 'Synthetic integration fixture',
      ...(role === 'student' && { student_number: reservation.studentNumber }),
    },
  });
  if (result.data.user) ownedIds.add(result.data.user.id);
  if (result.error || !result.data.user)
    throw new Error(`Fixture Auth creation failed (${result.error?.code})`);
  return { ...reservation, id: result.data.user.id };
}

export async function signIn(fixture: { email: string }, password = fixturePassword) {
  const client = anonymous();
  const result = await client.auth.signInWithPassword({ email: fixture.email, password });
  if (result.error || !result.data.session)
    throw new Error(`Fixture password sign-in failed (${result.error?.code})`);
  const claims = JSON.parse(
    Buffer.from(result.data.session.access_token.split('.')[1], 'base64url').toString()
  );
  return { client, sessionId: claims.session_id as string, session: result.data.session };
}

export async function actor(client: SupabaseClient) {
  const result = await client.rpc('current_actor');
  if (result.error) throw new Error(`Actor query failed (${result.error.code})`);
  return result.data;
}

export async function cleanFixtures() {
  const ids = [...new Set([...ownedIds, ...((await harness('cleanup_ids')) as string[])])];
  await mkdir('tests/integration/.artifacts', { recursive: true });
  const recoveryFile = `tests/integration/.artifacts/${runId}.json`;
  await saveFixtureJournal(recoveryFile, { projectRef: testProjectRef, runId, accountIds: ids });
  const drafts = await admin.rpc('test_course_fixture', {
    action: 'cleanup',
    run_id: runId,
    args: { project_ref: testProjectRef },
  });
  if (drafts.error && drafts.error.code !== 'PGRST202')
    throw new Error('Draft fixture cleanup failed; retain exact-run recovery artifact');
  await harness('cleanup');
  for (const id of ids) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error)
      throw new Error('Synthetic fixture cleanup failed; retain exact-run recovery artifact');
    ownedIds.delete(id);
  }
  await unlink(recoveryFile);
}
