// @vitest-environment node
import { beforeEach, expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const runtime = vi.hoisted(() => ({ admission: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ origin: 'https://example.test' }),
}));
vi.mock('@/lib/supabase/auth', async () => ({
  AuthenticationThrottled: (await import('@/lib/supabase/authentication-admission.mjs'))
    .AuthenticationThrottled,
  admitAuthRequest: runtime.admission,
}));
import { registerAccount, resendVerification } from '@/features/accounts/registration';
import { AuthenticationThrottled } from '@/lib/supabase/authentication-admission.mjs';
beforeEach(() => {
  vi.stubEnv('APP_ORIGIN', 'https://example.test');
  vi.stubEnv('SUPABASE_URL', 'https://example.supabase.co');
  runtime.admission.mockResolvedValue(async () => {});
});
const student = {
  role: 'student',
  fullName: 'Synthetic applicant',
  email: 'student@caloocan.sti.edu.ph',
  studentNumber: '000123',
  password: 'twelve words!',
};
test.each([
  [{ email: 'student@sub.caloocan.sti.edu.ph' }, 'email'],
  [{ email: 'student@caloocan.sti.edu.ph.invalid' }, 'email'],
  [{ role: 'administrator' }, 'role'],
  [{ role: 'program_head' }, 'role'],
  [{ password: '😀'.repeat(11) }, 'password'],
  [{ password: '😀'.repeat(18) + 'x' }, 'password'],
])('rejects invalid registration at the public boundary: %j', async (patch, field) => {
  expect(await registerAccount({ ...student, ...patch })).toMatchObject({
    ok: false,
    code: 'validation',
    errors: { [field]: expect.any(String) },
  });
});
test('maps admission denial without exposing input or native errors', async () => {
  runtime.admission.mockRejectedValue(new AuthenticationThrottled());
  expect(await registerAccount(student)).toEqual({ ok: false, code: 'throttled' });
  expect(await resendVerification('faculty@example.org')).toEqual({ ok: false, code: 'throttled' });
});
test('rejects malformed verification input and hides service exception details', async () => {
  expect(await resendVerification('not an email')).toEqual({ ok: false, code: 'invalid_input' });
  runtime.admission.mockRejectedValue(new Error('private provider details'));
  expect(await registerAccount(student)).toEqual({ ok: false, code: 'unavailable' });
});
