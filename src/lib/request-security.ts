import 'server-only';
import { isIP } from 'node:net';
import { timingSafeEqual } from 'node:crypto';
import type { Actor } from '@/features/accounts/types';
import { paths } from '@/config/paths';

export function assertMutationOrigin(request: Request): void {
  if (
    !process.env.APP_ORIGIN ||
    request.headers.get('origin') !== new URL(process.env.APP_ORIGIN).origin ||
    request.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new Error('Invalid mutation origin');
}
export function safeRedirectTarget(value: string | null, actor: Actor): string {
  const home = paths.roleHome(actor.role);
  if (value === home) return value;
  if (
    actor.role === 'faculty' &&
    value &&
    /^\/faculty\/courses(?:\/new|\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})?$/.test(
      value
    )
  )
    return value;
  return home;
}
export function trustedSourceIp(headers: Headers): string {
  const expected = process.env.LOCAL_PROXY_SECRET;
  const actual = headers.get('x-cs-proxy') ?? '';
  const ip = headers.get('x-cs-ip') ?? '';
  if (
    !expected ||
    expected.length < 32 ||
    Buffer.byteLength(actual) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(actual), Buffer.from(expected)) ||
    !isIP(ip)
  )
    throw new Error('Trusted local proxy required');
  return ip;
}
export async function assertBodySize(request: Request): Promise<void> {
  const maximum = 1048576;
  if (Number(request.headers.get('content-length')) > maximum) throw new Error('Request too large');
  const reader = request.clone().body?.getReader();
  if (!reader) return;
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maximum) throw new Error('Request too large');
    }
  } finally {
    void reader.cancel();
  }
}
