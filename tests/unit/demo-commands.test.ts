// @vitest-environment node
import { spawnSync } from 'node:child_process';
import { expect, it } from 'vitest';

it.each(['prepare-demo.mjs', 'maintenance.mjs'])(
  '%s --help works without provider configuration',
  (script) => {
    const result = spawnSync(process.execPath, [`scripts/${script}`, '--help'], {
      env: { PATH: process.env.PATH, NODE_ENV: 'test' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Usage:/);
  }
);
it('rejects changed projects and changed fixed identities when resuming setup', async () => {
  const modulePath = '../../scripts/demo-manifest.mjs';
  const subject = await import(modulePath).catch(() => null);
  expect(subject?.validateManifest).toBeTypeOf('function');
  if (!subject) return;
  const accounts = [
    'administrator',
    'student',
    'student',
    'student',
    'faculty',
    'faculty',
    'program_head',
  ].map((role, i) => ({
    role,
    fullName: `Synthetic ${i}`,
    email: role === 'student' ? `fixture-${i}@caloocan.sti.edu.ph` : `fixture-${i}@example.com`,
    ...(role === 'student' ? { studentNumber: `000${i}` } : {}),
  }));
  const normalized = subject.validateManifest({ accounts });
  expect(normalized).toHaveLength(7);
  expect(() => subject.validateManifest({ accounts: accounts.slice(1) })).toThrow();
  expect(() =>
    subject.validateManifest({
      accounts: accounts.map((a, i) => (i === 1 ? { ...a, email: 'wrong@example.com' } : a)),
    })
  ).toThrow();
  expect(() =>
    subject.validateManifest({
      accounts: accounts.map((a, i) => (i === 1 ? { ...a, password: 'never persist this' } : a)),
    })
  ).toThrow();
  const state = { projectRef: 'original', accounts: normalized, manifestHash: 'a'.repeat(64) };
  expect(() => subject.resumeManifest(state, 'changed', normalized)).toThrow();
  expect(() =>
    subject.resumeManifest(
      state,
      'original',
      normalized.map((a: Record<string, unknown>, i: number) =>
        i ? a : { ...a, fullName: 'Changed' }
      )
    )
  ).toThrow();
  expect(subject.resumeManifest(state, 'original', normalized).manifestHash).toBe(
    state.manifestHash
  );
});
it('rejects malformed hosted project references before constructing clients', async () => {
  const { vi } = await import('vitest');
  vi.stubEnv('DEMO_PROJECT_REF', 'user@malformed');
  vi.stubEnv('SUPABASE_URL', 'https://user@malformed.supabase.co');
  vi.stubEnv('APP_ORIGIN', 'https://demo.example');
  vi.stubEnv('SUPABASE_PUBLISHABLE_KEY', 'synthetic-publishable');
  vi.stubEnv('SUPABASE_SECRET_KEY', 'synthetic-secret');
  const { operatorEnvironment } = await import('../../scripts/operator-env.mjs');
  try {
    expect(() => operatorEnvironment(false)).toThrow('mismatched project URL');
  } finally {
    vi.unstubAllEnvs();
  }
});
