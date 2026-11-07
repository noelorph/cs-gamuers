// @vitest-environment node
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
// Hosted registration behavior is covered separately; this boundary records its validated input.
vi.mock('@/features/accounts/registration', () => ({
  registerAccount: async (input: unknown) => input,
}));
import { submitStudent, submitFaculty } from '@/app/auth/sign-up/actions';
const fields = {
  fullName: 'Synthetic applicant',
  studentNumber: '001-A',
  email: 'synthetic@caloocan.sti.edu.ph',
  password: 'Synthetic passphrase',
  employeeNumber: '001-E',
  role: 'administrator',
  application_status: 'approved',
  active: true,
};
it('Student action fixes role and excludes approval and activation fields', async () => {
  expect(await submitStudent(fields)).toEqual({
    role: 'student',
    fullName: 'Synthetic applicant',
    studentNumber: '001-A',
    employeeNumber: null,
    email: fields.email,
    password: fields.password,
  });
});
it('Faculty action fixes role and validates again before registration', async () => {
  expect(await submitFaculty(fields)).toEqual({
    role: 'faculty',
    fullName: 'Synthetic applicant',
    studentNumber: null,
    employeeNumber: '001-E',
    email: fields.email,
    password: fields.password,
  });
  expect(await submitFaculty({ ...fields, password: 'short' })).toMatchObject({
    ok: false,
    code: 'validation',
    errors: { password: expect.any(String) },
  });
});
