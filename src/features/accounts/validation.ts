import type { AccountInput } from './types';

export function validateAccountInput(
  input: unknown
): { data: AccountInput } | { errors: Partial<Record<keyof AccountInput, string>> } {
  const value =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const errors: Partial<Record<keyof AccountInput, string>> = {};
  const text = (field: keyof AccountInput) =>
    typeof value[field] === 'string' ? value[field].trim() : '';
  const role = value.role;
  const fullName = text('fullName');
  const studentNumber = role === 'student' ? text('studentNumber') : null;
  const employeeNumber = role === 'faculty' ? text('employeeNumber') || null : null;
  const email = text('email').toLowerCase();
  const password = typeof value.password === 'string' ? value.password : '';
  if (role !== 'student' && role !== 'faculty') errors.role = 'Choose Student or Faculty.';
  if (!fullName || [...fullName].length > 200)
    errors.fullName = 'Enter a name of at most 200 characters.';
  if (role === 'student' && (!studentNumber || [...studentNumber].length > 50))
    errors.studentNumber = 'Enter a student number of at most 50 characters.';
  if (employeeNumber && [...employeeNumber].length > 50)
    errors.employeeNumber = 'Use at most 50 characters.';
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    (role === 'student' && email.split('@')[1] !== 'caloocan.sti.edu.ph')
  )
    errors.email = 'Enter a valid email address; Students must use @caloocan.sti.edu.ph.';
  if ([...password].length < 12 || new TextEncoder().encode(password).length > 72)
    errors.password = 'Use at least 12 characters and at most 72 UTF-8 bytes.';
  if (Object.keys(errors).length || (role !== 'student' && role !== 'faculty')) return { errors };
  return { data: { role, fullName, studentNumber, employeeNumber, email, password } };
}

export function validateInvitationInput(
  input: unknown
):
  | { data: { fullName: string; password: string } }
  | { errors: { fullName?: string; password?: string } } {
  const value =
    input && typeof input === 'object' && !Array.isArray(input)
      ? (input as Record<string, unknown>)
      : {};
  const result = validateAccountInput({
    role: 'faculty',
    email: 'invitation@example.com',
    fullName: value.fullName,
    password: value.password,
  });
  if ('errors' in result)
    return { errors: { fullName: result.errors.fullName, password: result.errors.password } };
  return { data: { fullName: result.data.fullName, password: result.data.password } };
}
