// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { userTransport } from '@/lib/supabase/user-transport.mjs';
const url = 'https://example.supabase.co';
const key = 'sb_secret_synthetic';
const jwt = (role = 'authenticated', exp = Date.now() / 1000 + 60) =>
  `e30.${Buffer.from(JSON.stringify({ role, sub: 'synthetic', exp })).toString('base64url')}.signature`;
test('data requests never fall back to secret authority', async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('[]'));
  const transport = userTransport(url, key, fetcher);
  for (const authorization of [
    '',
    `Bearer ${key}`,
    `Bearer ${jwt('service_role')}`,
    `Bearer ${jwt('authenticated', 1)}`,
  ]) {
    const response = await transport(`${url}/rest/v1/accounts`, { headers: { authorization } });
    expect(response.status).toBe(401);
  }
  expect(fetcher).not.toHaveBeenCalled();
  const token = jwt();
  await transport(`${url}/rest/v1/accounts`, { headers: { authorization: `Bearer ${token}` } });
  expect(new Headers(fetcher.mock.calls[0][1]?.headers).get('authorization')).toBe(
    `Bearer ${token}`
  );
});
test('ordinary transport cannot call privileged Auth or other origins', async () => {
  const fetcher = vi.fn();
  const transport = userTransport(url, key, fetcher);
  for (const path of [`${url}/auth/v1/admin/users`, 'https://attacker.invalid/rest/v1/accounts'])
    expect((await transport(path)).status).toBe(403);
  expect(fetcher).not.toHaveBeenCalled();
});
test('admission runs before every native Auth mutation and failure suppresses network', async () => {
  const fetcher = vi.fn(async () => new Response('{}'));
  const admitted = vi.fn(async () => {
    throw Error('blocked');
  });
  await expect(
    userTransport(
      url,
      key,
      fetcher,
      admitted
    )(`${url}/auth/v1/token?grant_type=refresh_token`, { method: 'POST', body: '{}' })
  ).rejects.toThrow('blocked');
  expect(fetcher).not.toHaveBeenCalled();
});
