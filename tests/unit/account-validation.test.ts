import { describe, expect, it } from 'vitest';
import { validateAccountInput } from '@/features/accounts/validation';

const valid = {
  role: 'student',
  fullName: ' Synthetic Student ',
  studentNumber: '000123',
  email: ' Example@CALOOCAN.STI.EDU.PH ',
  password: ' twelve words ',
};

describe('account input', () => {
  it('normalizes identity while preserving leading zeros and password whitespace', () => {
    expect(validateAccountInput(valid)).toEqual({
      data: {
        ...valid,
        fullName: 'Synthetic Student',
        email: 'example@caloocan.sti.edu.ph',
        employeeNumber: null,
      },
    });
  });

  it.each([
    'x@sti.edu.ph',
    'x@other.caloocan.sti.edu.ph',
    'x@caloocan.sti.edu.ph.evil',
    'x@@caloocan.sti.edu.ph',
  ])('rejects a non-exact Student address', (email) => {
    expect(validateAccountInput({ ...valid, email })).toHaveProperty('errors.email');
  });

  it.each([null, [], 1, 'student'])('rejects non-object input', (input) => {
    expect(validateAccountInput(input)).toHaveProperty('errors');
  });

  it.each(['administrator', 'program_head', '', null])(
    'does not permit public elevated role selection',
    (role) => {
      expect(validateAccountInput({ ...valid, role })).toHaveProperty('errors.role');
    }
  );

  it('accepts Faculty personal email and optional employee number', () => {
    expect(
      validateAccountInput({
        ...valid,
        role: 'faculty',
        email: 'person@example.com',
        studentNumber: undefined,
      })
    ).toHaveProperty('data.employeeNumber', null);
  });

  it.each(['fullName', 'studentNumber', 'email', 'password'])(
    'requires identity and password fields',
    (field) => {
      expect(validateAccountInput({ ...valid, [field]: '' })).toHaveProperty(`errors.${field}`);
    }
  );

  it('counts Unicode code points for name and number limits', () => {
    expect(
      validateAccountInput({ ...valid, fullName: '😀'.repeat(200), studentNumber: '0'.repeat(50) })
    ).toHaveProperty('data');
    expect(validateAccountInput({ ...valid, fullName: '😀'.repeat(201) })).toHaveProperty(
      'errors.fullName'
    );
    expect(validateAccountInput({ ...valid, studentNumber: '0'.repeat(51) })).toHaveProperty(
      'errors.studentNumber'
    );
    expect(
      validateAccountInput({ ...valid, role: 'faculty', employeeNumber: '0'.repeat(51) })
    ).toHaveProperty('errors.employeeNumber');
  });

  it('limits email to 254 characters', () => {
    const domain = '@caloocan.sti.edu.ph';
    expect(
      validateAccountInput({ ...valid, email: 'x'.repeat(254 - domain.length) + domain })
    ).toHaveProperty('data');
    expect(
      validateAccountInput({ ...valid, email: 'x'.repeat(255 - domain.length) + domain })
    ).toHaveProperty('errors.email');
  });

  it('enforces 12 code points and 72 UTF-8 bytes without trimming', () => {
    for (const password of ['x'.repeat(12), ' '.repeat(12), '😀'.repeat(18), 'x'.repeat(72)]) {
      expect(validateAccountInput({ ...valid, password })).toHaveProperty(
        'data.password',
        password
      );
    }
    for (const password of ['😀'.repeat(11), 'x'.repeat(11), '😀'.repeat(19), 'x'.repeat(73)]) {
      expect(validateAccountInput({ ...valid, password })).toHaveProperty('errors.password');
    }
  });
});
