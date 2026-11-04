// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, test } from 'vitest';
import { admin, anonymous } from './helpers/fixtures';
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
test('ordinary users cannot access private limit RPCs', async () => {
  expect(
    (
      await anonymous().rpc('admit_authentication', {
        source_ip: source(),
        identifier: identifier(),
      })
    ).error
  ).toBeTruthy();
});
