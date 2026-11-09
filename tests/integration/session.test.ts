// @vitest-environment node
import { afterAll, expect, test } from 'vitest';
import {
  admin,
  actor,
  anonymous,
  createFixture,
  signIn,
  harness,
  cleanFixtures,
} from './helpers/fixtures';
afterAll(cleanFixtures, 30000);
test('native local sign-out removes database authority from the captured still-unexpired JWT', async () => {
  const fixture = await createFixture('faculty');
  await harness('state', { account_id: fixture.id, status: 'approved' });
  const { client, session } = await signIn(fixture);
  expect(await actor(client)).toHaveLength(1);
  const { error } = await admin.auth.admin.signOut(session.access_token, 'local');
  expect(error).toBeNull();
  expect(await actor(client)).toEqual([]);
  const old = await fetch(`${process.env.TEST_SUPABASE_URL}/rest/v1/rpc/current_actor`, {
    method: 'POST',
    headers: {
      apikey: process.env.TEST_SUPABASE_SECRET_KEY!,
      authorization: `Bearer ${session.access_token}`,
      'content-type': 'application/json',
    },
    body: '{}',
  });
  expect(old.status).toBe(200);
  expect(await old.json()).toEqual([]);
  expect(
    (await anonymous().auth.refreshSession({ refresh_token: session.refresh_token })).error
  ).toBeTruthy();
});
test('password status projections are narrow and deactivated sessions cannot become actors', async () => {
  const fixture = await createFixture();
  const { client } = await signIn(fixture);
  const pending = await client.rpc('account_status');
  expect(pending.error).toBeNull();
  expect(pending.data).toEqual([{ application_status: 'pending', active: true }]);
  await harness('state', { account_id: fixture.id, active: false });
  const fresh = await signIn(fixture);
  expect(await actor(fresh.client)).toEqual([]);
  const status = await fresh.client.rpc('account_status');
  expect(status.error).toBeNull();
  expect(status.data).toEqual([{ application_status: 'pending', active: false }]);
});
