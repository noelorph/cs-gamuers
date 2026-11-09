import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const { validateAccountInput, validateInvitationInput } = createRequire(import.meta.url)(
  '../src/features/accounts/validation.ts'
);

export function validateManifest(manifest) {
  if (
    !manifest ||
    Object.keys(manifest).join() !== 'accounts' ||
    !Array.isArray(manifest.accounts) ||
    manifest.accounts.length !== 7
  )
    throw Error('Manifest must contain exactly seven named fixture slots.');
  const counts = { administrator: 0, program_head: 0, student: 0, faculty: 0 };
  const emails = new Set();
  const numbers = new Set();
  const accounts = manifest.accounts.map((account) => {
    if (
      !account ||
      typeof account !== 'object' ||
      Array.isArray(account) ||
      Object.keys(account).some(
        (key) => !['role', 'fullName', 'email', 'studentNumber', 'employeeNumber'].includes(key)
      ) ||
      !(account.role in counts)
    )
      throw Error('Invalid manifest fields; passwords must never be stored.');
    const index = ++counts[account.role];
    const slot = ['student', 'faculty'].includes(account.role)
      ? `${account.role}_${index}`
      : account.role;
    const email = typeof account.email === 'string' ? account.email.trim().toLowerCase() : '';
    const fullName = typeof account.fullName === 'string' ? account.fullName.trim() : '';
    const studentNumber =
      account.role === 'student' && typeof account.studentNumber === 'string'
        ? account.studentNumber.trim()
        : null;
    const employeeNumber =
      account.role !== 'student' && typeof account.employeeNumber === 'string'
        ? account.employeeNumber.trim() || null
        : null;
    if (!email && slot !== 'student_3')
      throw Error('Only the pending third Student email may be blank.');
    const validated = ['student', 'faculty'].includes(account.role)
      ? validateAccountInput({
          role: account.role,
          fullName,
          email: email || 'pending@caloocan.sti.edu.ph',
          studentNumber,
          employeeNumber,
          password: 'validation placeholder only',
        })
      : validateInvitationInput({ fullName, password: 'validation placeholder only' });
    if (
      'errors' in validated ||
      (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
    )
      throw Error('Invalid fixture identity.');
    if ((email && emails.has(email)) || (studentNumber && numbers.has(studentNumber)))
      throw Error('Fixture identities must be unique.');
    emails.add(email);
    if (studentNumber) numbers.add(studentNumber);
    return { slot, role: account.role, fullName, email, studentNumber, employeeNumber };
  });
  if (
    counts.administrator !== 1 ||
    counts.program_head !== 1 ||
    counts.student !== 3 ||
    counts.faculty !== 2
  )
    throw Error(
      'Required roles: one Administrator, one Program Head, three Students, two Faculty.'
    );
  return accounts;
}
export function resumeManifest(state, projectRef, accounts) {
  if (!state)
    return {
      projectRef,
      accounts,
      manifestHash: createHash('sha256').update(JSON.stringify(accounts)).digest('hex'),
    };
  if (
    state.projectRef !== projectRef ||
    state.accounts.length !== 7 ||
    !/^[a-f0-9]{64}$/.test(state.manifestHash)
  )
    throw Error('Refusing changed setup project.');
  for (let i = 0; i < 7; i++) {
    const before = state.accounts[i],
      after = accounts[i];
    for (const key of ['slot', 'role', 'fullName', 'studentNumber', 'employeeNumber'])
      if (before[key] !== after[key]) throw Error('Refusing changed setup identity.');
    if (
      before.email !== after.email &&
      !(before.slot === 'student_3' && !before.email && after.email)
    )
      throw Error('Refusing changed setup address.');
  }
  return { ...state, accounts };
}
