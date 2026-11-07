'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VerifyEmailForm } from '@/components/verify-email-form';
import { validateAccountInput } from '@/features/accounts/validation';
import type { AccountInput } from '@/features/accounts/types';
import type { RegistrationResult, VerificationResult } from '@/features/accounts/registration';
export function SignUpForm({
  role,
  submit,
  resend,
}: {
  role: 'student' | 'faculty';
  submit: (input: unknown) => Promise<RegistrationResult>;
  resend: (email: string) => Promise<VerificationResult>;
}) {
  const [values, setValues] = useState({
    fullName: '',
    studentNumber: '',
    email: '',
    employeeNumber: '',
    password: '',
  });
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [queued, setQueued] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof AccountInput, string>>>({});
  const [message, setMessage] = useState('');
  const feedback = useRef<HTMLDivElement>(null);
  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setErrors({});
    setMessage('');
    const checked = validateAccountInput({ ...values, role });
    // Passwords remain in this submission only, including invalid submissions.
    setValues((v) => ({ ...v, password: '' }));
    setVisible(false);
    if ('errors' in checked) {
      setErrors(checked.errors);
      setMessage('Check the highlighted fields before submitting.');
      requestAnimationFrame(() => feedback.current?.focus());
      return;
    }
    setPending(true);
    try {
      const result = await submit(checked.data);
      if (result.ok && result.verification === 'queued') setQueued(true);
      else if (result.ok)
        setMessage(
          'We could not use these details. Check them, sign in if you already applied, or ask an Administrator for help.'
        );
      else if (result.code === 'validation') {
        setErrors(result.errors);
        setMessage('Check the highlighted fields before submitting.');
      } else
        setMessage(
          result.code === 'throttled'
            ? 'Too many application requests. Wait before trying again.'
            : 'Application submission is unavailable. Try again to check this request.'
        );
    } catch {
      setMessage('We could not confirm the result. Try again to check this request.');
    } finally {
      setPending(false);
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }
  if (queued) return <VerifyEmailForm initialEmail={values.email} queued resend={resend} />;
  const fields: {
    key: keyof typeof values;
    id: string;
    label: string;
    help: string;
    autocomplete?: string;
  }[] = [
    {
      key: 'fullName' as const,
      id: 'full-name',
      label: 'Full name (required)',
      help:
        role === 'student'
          ? 'Use your name as it appears on the enrollment list.'
          : 'Use your full name as it appears on school records.',
      autocomplete: 'name',
    },
    ...(role === 'student'
      ? [
          {
            key: 'studentNumber' as const,
            id: 'student-number',
            label: 'Student number (required)',
            help: 'Enter your complete student number, including any leading zeros.',
          },
        ]
      : []),
    {
      key: 'email' as const,
      id: 'email',
      label: role === 'student' ? 'School email (required)' : 'Email (required)',
      help:
        role === 'student'
          ? 'Use your existing @caloocan.sti.edu.ph address.'
          : 'A personal email address is allowed.',
      autocomplete: 'email',
    },
    ...(role === 'faculty'
      ? [
          {
            key: 'employeeNumber' as const,
            id: 'employee-number',
            label: 'Employee number (optional)',
            help: 'Leave blank if you do not have it available.',
          },
        ]
      : []),
    {
      key: 'password' as const,
      id: 'password',
      label: 'Password (required)',
      help: 'Use at least 12 characters. Spaces and passphrases are welcome. Maximum 72 UTF-8 bytes; some characters use more than one byte. Use a separate CS-GAMUERS password.',
      autocomplete: 'new-password',
    },
  ];
  return (
    <>
      <h1 className="m-0 text-2xl font-semibold leading-tight">
        {role === 'student' ? 'Apply as a Student' : 'Apply as Faculty'}
      </h1>
      <p className="text-muted-foreground">
        {role === 'student'
          ? 'Faculty or an Administrator will check your application against the enrollment list.'
          : 'An Administrator will check your authorization and school-issued employee ID in person.'}
      </p>
      <form onSubmit={send} noValidate className="grid gap-4">
        {message && (
          <div
            ref={feedback}
            role="alert"
            tabIndex={-1}
            className="text-destructive focus:outline-solid focus:outline-3 focus:outline-ring focus:outline-offset-2"
          >
            {message}
            {Object.entries(errors).length > 0 && (
              <ul>
                {fields
                  .filter((f) => errors[f.key])
                  .map((f) => (
                    <li key={f.key}>
                      <a href={`#${f.id}`}>{errors[f.key]}</a>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
        {fields.map((field) => (
          <div key={field.key} className="grid gap-2">
            <label htmlFor={field.id} className="text-sm font-medium">
              {field.label}
            </label>
            <div className="flex min-w-0 gap-2">
              <Input
                id={field.id}
                name={field.key}
                type={
                  field.key === 'password'
                    ? visible
                      ? 'text'
                      : 'password'
                    : field.key === 'email'
                      ? 'email'
                      : 'text'
                }
                autoComplete={'autocomplete' in field ? field.autocomplete : 'off'}
                autoCapitalize={field.key === 'email' ? 'none' : undefined}
                spellCheck={field.key === 'email' ? false : undefined}
                maxLength={field.key === 'email' ? 254 : undefined}
                value={values[field.key]}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                aria-invalid={!!errors[field.key]}
                aria-describedby={`${field.id}-help${errors[field.key] ? ` ${field.id}-error` : ''}`}
                disabled={pending}
                required={field.key !== 'employeeNumber'}
              />
              {field.key === 'password' && (
                <Button
                  type="button"
                  variant="outline"
                  aria-controls="password"
                  aria-pressed={visible}
                  aria-label={visible ? 'Hide password' : 'Show password'}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? 'Hide' : 'Show'}
                </Button>
              )}
            </div>
            <p id={`${field.id}-help`} className="m-0 text-sm text-muted-foreground">
              {field.help}
            </p>
            {errors[field.key] && (
              <p id={`${field.id}-error`} className="m-0 text-sm text-destructive">
                {errors[field.key]}
              </p>
            )}
          </div>
        ))}
        <p className="m-0 text-sm text-muted-foreground">
          You will verify your email, then wait for application approval.
        </p>
        <Button disabled={pending}>
          {pending ? 'Submitting application…' : 'Submit application'}
        </Button>
      </form>
      <div className="flex flex-col gap-4 border-0 border-t border-solid border-border pt-6 text-sm">
        <p className="m-0">
          Already applied? <Link href="/auth/sign-in">Sign in</Link>
        </p>
        <Link href={`/auth/sign-up/${role === 'student' ? 'faculty' : 'student'}`}>
          {role === 'student' ? 'Apply as Faculty instead' : 'Apply as a Student instead'}
        </Link>
      </div>
    </>
  );
}
