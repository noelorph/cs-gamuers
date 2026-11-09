// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { nativeVerificationFetch } from '../integration/helpers/native-verification-fetch.mjs';

vi.mock('node:timers/promises', () => ({ setTimeout: vi.fn() }));
import { setTimeout as pause } from 'node:timers/promises';
const url = 'https://example.supabase.co';
const limited = (code = 'over_request_rate_limit', headers = {}) =>
  Response.json({ code }, { status: 429, headers });
afterEach(() => vi.restoreAllMocks());

test('replays the same verification once after a definite quota rejection and preserves final errors', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.mocked(pause).mockResolvedValue(undefined);
  const requests: Request[] = [];
  const fetcher = vi.fn<typeof fetch>(async (input, init) => {
    requests.push(new Request(input, init));
    return limited();
  });
  const response = await nativeVerificationFetch(url, fetcher)(`${url}/auth/v1/verify`, {
    method: 'POST',
    body: JSON.stringify({ token_hash: 'synthetic-proof', type: 'recovery' }),
    headers: { 'content-type': 'application/json' },
  });
  expect(requests).toHaveLength(2);
  expect(await requests[0].text()).toBe(await requests[1].text());
  expect(vi.mocked(pause).mock.calls.at(-1)?.[0]).toBe(11000);
  expect(response.status).toBe(429);
  expect(await response.json()).toEqual({ code: 'over_request_rate_limit' });
});

test.each([
  [`${url}/auth/v1/token`, 'POST', limited()],
  ['https://foreign.invalid/auth/v1/verify', 'POST', limited()],
  [`${url}/auth/v1/verify?unexpected=1`, 'POST', limited()],
  [`${url}/auth/v1/verify`, 'GET', limited()],
  [`${url}/auth/v1/verify`, 'POST', limited('other_error')],
  [`${url}/auth/v1/verify`, 'POST', new Response('not-json', { status: 429 })],
  [
    `${url}/auth/v1/verify`,
    'POST',
    limited('over_request_rate_limit', { 'retry-after': 'invalid' }),
  ],
  [`${url}/auth/v1/verify`, 'POST', limited('over_request_rate_limit', { 'retry-after': '30' })],
  [`${url}/auth/v1/verify`, 'POST', new Response('{}')],
] as const)(
  'does not retry other outcomes or exceed its wait budget: %s %s',
  async (target, method, result) => {
    const fetcher = vi.fn(async () => result.clone());
    const response = await nativeVerificationFetch(url, fetcher)(target, { method });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(result.status);
    expect(await response.text()).toBe(await result.clone().text());
  }
);

test('honors a bounded Retry-After and returns a successful second response', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.mocked(pause).mockResolvedValue(undefined);
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(limited('over_request_rate_limit', { 'retry-after': '2' }))
    .mockResolvedValueOnce(Response.json({ verified: true }));
  const response = await nativeVerificationFetch(url, fetcher)(`${url}/auth/v1/verify`, {
    method: 'POST',
  });
  expect(vi.mocked(pause).mock.calls.at(-1)?.[0]).toBe(2000);
  expect(await response.json()).toEqual({ verified: true });
  expect(fetcher).toHaveBeenCalledTimes(2);
});

test('does not replay a request after an uncertain network failure', async () => {
  const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('Network interrupted'));
  await expect(
    nativeVerificationFetch(url, fetcher)(`${url}/auth/v1/verify`, { method: 'POST' })
  ).rejects.toThrow('Network interrupted');
  expect(fetcher).toHaveBeenCalledTimes(1);
});

test('preserves caller cancellation during the quota wait without another request', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const controller = new AbortController();
  vi.mocked(pause).mockImplementationOnce(async (_delay, _value, options) => {
    controller.abort();
    options?.signal?.throwIfAborted();
  });
  const fetcher = vi.fn(async () => limited());
  await expect(
    nativeVerificationFetch(url, fetcher)(`${url}/auth/v1/verify`, {
      method: 'POST',
      signal: controller.signal,
    })
  ).rejects.toThrow();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
