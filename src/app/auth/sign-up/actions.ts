'use server';
import { registerAccount } from '@/features/accounts/registration';
import { validateAccountInput } from '@/features/accounts/validation';
function fixedInput(input: unknown, role: 'student' | 'faculty') {
  const value =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  return validateAccountInput({
    fullName: value.fullName,
    studentNumber: value.studentNumber,
    employeeNumber: value.employeeNumber,
    email: value.email,
    password: value.password,
    role,
  });
}
export async function submitStudent(input: unknown) {
  const checked = fixedInput(input, 'student');
  return 'errors' in checked
    ? { ok: false as const, code: 'validation' as const, errors: checked.errors }
    : registerAccount(checked.data);
}
export async function submitFaculty(input: unknown) {
  const checked = fixedInput(input, 'faculty');
  return 'errors' in checked
    ? { ok: false as const, code: 'validation' as const, errors: checked.errors }
    : registerAccount(checked.data);
}
