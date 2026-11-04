// @vitest-environment node
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { getAdminEnv, getAppEnv, getMailEnv } from '@/config/env';
import { paths } from '@/config/paths';
import { assertIsolatedTestTarget } from '../integration/helpers/environment';

const app = {
  APP_ORIGIN: 'https://demo.invalid',
  SUPABASE_URL: 'https://demo-ref.supabase.co',
};
const isolated = {
  SUPABASE_URL: app.SUPABASE_URL,
  DEMO_PROJECT_REF: 'demo-ref',
  TEST_SUPABASE_URL: 'https://test-ref.supabase.co',
  TEST_SUPABASE_PROJECT_REF: 'test-ref',
};

beforeEach(() => {
  for (const key of [
    ...Object.keys(app),
    'SUPABASE_SECRET_KEY',
    'DEMO_PROJECT_REF',
    'TEST_SUPABASE_URL',
    'TEST_SUPABASE_PROJECT_REF',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASSWORD',
    'SMTP_FROM',
    'GROQ_API_KEY',
  ])
    vi.stubEnv(key, undefined);
});
afterEach(() => vi.unstubAllEnvs());

function setEnv(values: Record<string, string>) {
  for (const [key, value] of Object.entries(values)) vi.stubEnv(key, value);
}

test('configuration imports lazily; missing Supabase fails only its consumer', () => {
  expect(getAppEnv).toBeTypeOf('function');
  setEnv({ SUPABASE_SECRET_KEY: 'synthetic-secret', DEMO_PROJECT_REF: 'demo-ref' });
  expect(getAdminEnv()).toEqual({ secretKey: 'synthetic-secret', demoProjectRef: 'demo-ref' });
  expect(getAppEnv).toThrow(/APP_ORIGIN/);
  setEnv({ APP_ORIGIN: app.APP_ORIGIN });
  expect(getAppEnv).toThrow(/SUPABASE_URL/);
  setEnv({ SUPABASE_URL: app.SUPABASE_URL });
  expect(getAppEnv).not.toThrow();
});

test('SMTP and AI absence does not block application configuration', () => {
  setEnv(app);
  expect(getAppEnv()).toEqual({
    appOrigin: new URL(app.APP_ORIGIN),
    supabaseUrl: app.SUPABASE_URL,
  });
  expect(getMailEnv).toThrow(/SMTP_HOST/);
  expect(getAdminEnv).toThrow(/SUPABASE_SECRET_KEY/);
});

test.each([
  'http://demo.invalid',
  'invalid',
  'https://user:secret@demo.invalid',
  'https://demo.invalid/path',
  'https://demo.invalid/?next=other',
  'https://demo.invalid/#fragment',
])('rejects unsafe APP_ORIGIN %s', (origin) => {
  setEnv({ ...app, APP_ORIGIN: origin });
  expect(getAppEnv).toThrow(/APP_ORIGIN/);
});

test('mail configuration is independent and preserves credential whitespace', () => {
  setEnv({
    SMTP_HOST: 'smtp.invalid',
    SMTP_PORT: '465',
    SMTP_USER: 'synthetic',
    SMTP_PASSWORD: ' synthetic ',
    SMTP_FROM: 'synthetic',
  });
  expect(getMailEnv()).toEqual({
    host: 'smtp.invalid',
    port: 465,
    user: 'synthetic',
    password: ' synthetic ',
    from: 'synthetic',
  });
});

test.each(['0', '65536', 'NaN', '465.5', ''])('rejects invalid SMTP port %s', (port) => {
  setEnv({ SMTP_HOST: 'smtp.invalid', SMTP_PORT: port });
  expect(getMailEnv).toThrow(/SMTP_PORT/);
});

test('test target must be explicitly configured and distinct', () => {
  expect(assertIsolatedTestTarget).toThrow();
  setEnv(isolated);
  expect(assertIsolatedTestTarget).not.toThrow();
});

test.each([
  { TEST_SUPABASE_PROJECT_REF: '' },
  { DEMO_PROJECT_REF: '' },
  { TEST_SUPABASE_URL: '' },
  { TEST_SUPABASE_PROJECT_REF: 'demo-ref' },
  { TEST_SUPABASE_URL: 'https://demo-ref.supabase.co' },
  { TEST_SUPABASE_URL: 'https://other-ref.supabase.co' },
  { TEST_SUPABASE_URL: 'https://test-ref.supabase.co.attacker.invalid' },
  { TEST_SUPABASE_URL: 'http://test-ref.supabase.co' },
  { TEST_SUPABASE_URL: 'https://secret@test-ref.supabase.co' },
  { TEST_SUPABASE_URL: 'https://test-ref.supabase.co/path' },
  { SUPABASE_URL: 'https://TEST-REF.supabase.co:443/' },
  { DEMO_PROJECT_REF: 'TEST-REF' },
])('refuses absent, mismatched or aliased target: %j', (override) => {
  setEnv({ ...isolated, ...override });
  expect(assertIsolatedTestTarget).toThrow();
});

test('route builders stay relative and encode the course segment', () => {
  expect(paths.roleHome('student')).toBe('/student');
  expect(paths.roleHome('faculty')).toBe('/faculty');
  expect(paths.roleHome('program_head')).toBe('/program-head');
  expect(paths.roleHome('administrator')).toBe('/admin');
  expect(paths.courseDraft('a/b?x#y')).toBe('/faculty/courses/a%2Fb%3Fx%23y');
});
