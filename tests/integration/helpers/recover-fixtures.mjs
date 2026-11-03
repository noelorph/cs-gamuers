import { loadEnvFile } from 'node:process';
import { readFile, unlink } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
import { saveFixtureJournal } from './fixture-journal.mjs';
const { assertIsolatedTestTarget } = createRequire(import.meta.url)(
  '../../../src/config/test-target.ts'
);

async function recover() {
  if (process.argv.includes('--help')) {
    console.log(
      'Usage: node tests/integration/helpers/recover-fixtures.mjs <exact-run-artifact.json>'
    );
    return;
  }
  try {
    loadEnvFile('.env.local');
  } catch {
    /* CI may supply environment directly. */
  }
  assertIsolatedTestTarget();
  const file = process.argv[2];
  if (!file) throw Error('Exact run artifact required');
  const state = JSON.parse(await readFile(file, 'utf8'));
  const uuid = /^[a-f0-9]{8}-[a-f0-9-]{27}$/;
  if (
    state.projectRef !== 'ggiccvcrkydcimveyrfi' ||
    state.projectRef !== process.env.TEST_SUPABASE_PROJECT_REF ||
    !uuid.test(state.runId) ||
    !Array.isArray(state.accountIds) ||
    !state.accountIds.every((id) => typeof id === 'string' && uuid.test(id))
  )
    throw Error('Invalid recovery binding');
  const client = createClient(process.env.TEST_SUPABASE_URL, process.env.TEST_SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const args = { run_id: state.runId, args: { project_ref: state.projectRef } };
  const ids = await client.rpc('test_account_fixture', { ...args, action: 'cleanup_ids' });
  if (ids.error) throw Error('Read ownership failed');
  state.accountIds = [...new Set([...state.accountIds, ...ids.data])];
  await saveFixtureJournal(file, state);
  const cleanup = await client.rpc('test_account_fixture', { ...args, action: 'cleanup' });
  if (cleanup.error) throw Error('Application cleanup failed');
  for (const id of state.accountIds) {
    const result = await client.auth.admin.deleteUser(id);
    if (result.error && result.error.code !== 'user_not_found')
      throw Error('Native cleanup failed');
  }
  await unlink(file);
  console.log('Exact-run synthetic cleanup complete.');
}
recover().catch(() => {
  console.error('Recovery stopped; retain the exact-run artifact for retry.');
  process.exitCode = 1;
});
