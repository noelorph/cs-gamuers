// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import {
  assertMutationOrigin,
  safeRedirectTarget,
  trustedSourceIp,
  assertBodySize,
} from '@/lib/request-security';
afterEach(() => vi.unstubAllEnvs());
const actor = { id: 'synthetic', role: 'faculty' as const };
test('only exact same-origin mutation requests are accepted', () => {
  vi.stubEnv('APP_ORIGIN', 'https://demo.invalid');
  for (const origin of [
    null,
    'null',
    'https://attacker.invalid',
    'https://demo.invalid.attacker.invalid',
  ]) {
    expect(() =>
      assertMutationOrigin(
        new Request('https://demo.invalid/auth/sign-out', {
          method: 'POST',
          headers: origin ? { origin } : {},
        })
      )
    ).toThrow();
  }
  expect(() =>
    assertMutationOrigin(
      new Request('https://demo.invalid/auth/sign-out', {
        method: 'POST',
        headers: { origin: 'https://demo.invalid' },
      })
    )
  ).not.toThrow();
});
test('redirects remain within the actor role and explicit routes', () => {
  for (const value of [
    null,
    '//evil.invalid',
    'https://evil.invalid',
    '/\\evil.invalid',
    '/admin',
    '/faculty?next=evil',
    '/faculty/%2f%2fevil',
    '/faculty/courses/../../admin',
  ]) {
    expect(safeRedirectTarget(value, actor)).toBe('/faculty');
  }
  expect(safeRedirectTarget('/faculty/courses', actor)).toBe('/faculty/courses');
  expect(safeRedirectTarget('/faculty/courses/123e4567-e89b-12d3-a456-426614174000', actor)).toBe(
    '/faculty/courses/123e4567-e89b-12d3-a456-426614174000'
  );
  expect(safeRedirectTarget('/faculty', { id: 'x', role: 'student' })).toBe('/student');
});
test('only authenticated Caddy forwarding identifies a source IP', () => {
  vi.stubEnv('LOCAL_PROXY_SECRET', 'test-secret-'.repeat(4));
  expect(() =>
    trustedSourceIp(new Headers({ 'x-forwarded-for': '127.0.0.1', 'x-cs-ip': '127.0.0.1' }))
  ).toThrow();
  for (const value of ['127.0.0.1, 1.2.3.4', 'unknown', ''])
    expect(() =>
      trustedSourceIp(new Headers({ 'x-cs-proxy': 'test-secret-'.repeat(4), 'x-cs-ip': value }))
    ).toThrow();
  expect(
    trustedSourceIp(new Headers({ 'x-cs-proxy': 'test-secret-'.repeat(4), 'x-cs-ip': '192.0.2.1' }))
  ).toBe('192.0.2.1');
});
test('serialized body limit counts streamed bytes even without Content-Length', async () => {
  await expect(
    assertBodySize(
      new Request('https://demo.invalid', { method: 'POST', body: 'a'.repeat(1048576) })
    )
  ).resolves.toBeUndefined();
  await expect(
    assertBodySize(
      new Request('https://demo.invalid', { method: 'POST', body: 'é'.repeat(524289) })
    )
  ).rejects.toThrow();
});
