// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { afterAll, expect, test } from 'vitest';
import {
  admin,
  anonymous,
  createFixture,
  signIn,
  harness,
  cleanFixtures,
} from './helpers/fixtures';
afterAll(cleanFixtures, 30000);
const identifier = () => `${randomUUID()}@example.invalid`;
const source = () => `2001:db8:${randomUUID().slice(0, 4)}:${randomUUID().slice(0, 4)}::1`;
async function admit(ip: string, email: string | null = null) {
  return admin.rpc('admit_authentication', { source_ip: ip, identifier: email });
}
test('concurrent failures reserve ten slots across normalized identifiers and IPs', async () => {
  const email = identifier();
  const results = await Promise.all(
    Array.from({ length: 11 }, (_, i) =>
      admit(source(), i % 2 ? ` ${email.toUpperCase()} ` : email)
    )
  );
  expect(results.filter((r) => !!r.data)).toHaveLength(10);
  expect(results.filter((r) => r.data === null && !r.error)).toHaveLength(1);
  expect(results.some((r) => !!r.error)).toBe(false);
});
test('successful attempts release only their identifier reservation, never the shared IP submission', async () => {
  const ip = source();
  const email = identifier();
  for (let i = 0; i < 100; i++) {
    const result = await admit(ip, email);
    expect(result.error).toBeNull();
    expect(result.data).toBeTruthy();
    const done = await admin.rpc('finish_authentication', {
      attempt_id: result.data,
      succeeded: true,
    });
    expect(done.error).toBeNull();
  }
  expect((await admit(ip, identifier())).data).toBeNull();
}, 60000);
test('missing sessions are rejected by the transport before private limit RPCs', async () => {
  expect(
    (
      await anonymous().rpc('admit_authentication', {
        source_ip: source(),
        identifier: identifier(),
      })
    ).error
  ).toBeTruthy();
});

test('an authenticated JWT reaches PostgreSQL and is denied both private limit RPCs', async () => {
  const account = await createFixture('faculty');
  await harness('state', { account_id: account.id, status: 'approved' });
  const { client } = await signIn(account);
  const admitted = await client.rpc('admit_authentication', {
    source_ip: source(),
    identifier: identifier(),
  });
  expect(admitted.status).toBe(403);
  expect(admitted.error?.code).toBe('42501');
  const completed = await client.rpc('finish_authentication', {
    attempt_id: randomUUID(),
    succeeded: true,
  });
  expect(completed.status).toBe(403);
  expect(completed.error?.code).toBe('42501');
});
