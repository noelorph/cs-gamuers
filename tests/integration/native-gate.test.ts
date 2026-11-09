// @vitest-environment node
import { afterAll, expect, test } from 'vitest';
import { isGatewayKeyRejection } from './helpers/gateway-evidence';
import {
  anonymous,
  cleanFixtures,
  createFixture,
  signIn,
  testProjectRef,
} from './helpers/fixtures';
const enabled = process.env.RUN_NATIVE_GATE_PROBE === testProjectRef;
afterAll(async () => {
  if (enabled) await cleanFixtures();
}, 30000);
test.skipIf(!enabled)(
  'private gateway rejects every public credential before password/token handlers',
  async () => {
    const retiredKeys = [
      'TEST_SUPABASE_PUBLISHABLE_KEY',
      'TEST_REVOKED_ANON_KEY',
      'TEST_REVOKED_SERVICE_ROLE_KEY',
    ].map((name) => {
      const value = process.env[name];
      if (!value) throw new Error(`Supply ${name} privately for native gate proof`);
      return value;
    });
    const fixture = await createFixture();
    const { session } = await signIn(fixture);
    const url = process.env.TEST_SUPABASE_URL!;
    const credentials = [
      ['none', ''],
      ['malformed', 'invalid'],
      ['retired-publishable', retiredKeys[0]],
      ['retired-anon', retiredKeys[1]],
      ['retired-service', retiredKeys[2]],
      ['user-jwt-as-key', session.access_token],
    ];
    const endpoints = [
      ['/token?grant_type=password', 'POST'],
      ['/token?grant_type=refresh_token', 'POST'],
      ['/token?grant_type=pkce', 'POST'],
      ['/signup', 'POST'],
      ['/recover', 'POST'],
      ['/resend', 'POST'],
      ['/otp', 'POST'],
      ['/user', 'PUT'],
      ['/factors', 'POST'],
    ];
    const failures: string[] = [];
    for (const [label, key] of credentials)
      for (const [path, method] of endpoints) {
        const response = await fetch(`${url}/auth/v1${path}`, {
          method,
          headers: { 'content-type': 'application/json', ...(key ? { apikey: key } : {}) },
          body: '{}',
          redirect: 'manual',
        });
        if (!isGatewayKeyRejection(response))
          failures.push(`${label} ${path.split('?')[0]} ${response.status}`);
      }
    for (const headers of [
      { authorization: `Bearer ${session.access_token}` },
      { apikey: session.access_token, authorization: `Bearer ${session.access_token}` },
    ] as Record<string, string>[]) {
      const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: '{}',
        redirect: 'manual',
      });
      if (!isGatewayKeyRejection(response))
        failures.push(`authorization-only-or-jwt-key token ${response.status}`);
    }
    const queryKey = await fetch(
      `${url}/auth/v1/token?grant_type=password&apikey=${encodeURIComponent(retiredKeys[0])}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
        redirect: 'manual',
      }
    );
    if (!isGatewayKeyRejection(queryKey))
      failures.push(`query-retired-key token ${queryKey.status}`);
    // Keyless verification is deliberately outside the application counter; invalid proof must never yield a session.
    for (const method of ['GET', 'POST']) {
      const response = await fetch(`${url}/auth/v1/verify`, {
        method,
        ...(method === 'POST'
          ? { headers: { 'content-type': 'application/json' }, body: '{}' }
          : {}),
        redirect: 'manual',
      });
      expect(response.status).toBe(400);
    }
    const status = await anonymous().auth.getUser(session.access_token);
    expect(status.error).toBeNull();
    expect(
      failures,
      'Every key rejection must carry the observed gateway error header; an Auth 401 is insufficient'
    ).toEqual([]);
  },
  60000
);
