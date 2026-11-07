'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateInvitationInput } from '@/features/accounts/validation';

type Confirmation = {
  operationId: string;
  purpose: 'verification' | 'invitation';
  invitation?: { email: string; role: 'administrator' | 'program_head' };
};
type Props = {
  challenge: string;
  prepare: () => Promise<void | { error: string }>;
  confirm: (challenge: string) => Promise<Confirmation | { error: string }>;
  complete: (
    id: string,
    input: { fullName: string; password: string; employeeNumber?: string }
  ) => Promise<{ complete: true } | { error: string }>;
};
export function EmailForm({ challenge, prepare, confirm, complete }: Props) {
  const [operation, setOperation] = useState<Confirmation | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<{
    fullName?: string;
    password?: string;
    employeeNumber?: string;
  }>({});
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [visible, setVisible] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const status = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (operation || done) heading.current?.focus();
  }, [operation, done]);
  if (done)
    return (
      <>
        <h1
          ref={heading}
          tabIndex={-1}
          className="focus:outline-solid focus:outline-3 focus:outline-ring focus:outline-offset-2 m-0 text-2xl font-semibold"
        >
          {operation ? 'Invitation accepted' : 'Email verified'}
        </h1>
        <p role="status">
          {operation
            ? 'Your invitation is complete. Sign in with your CS-GAMUERS password.'
            : 'Email verified. Your application still needs approval.'}
        </p>
        <Link
          href={
            operation?.invitation?.role === 'administrator' ? '/admin/sign-in' : '/auth/sign-in'
          }
        >
          {operation?.invitation?.role === 'administrator'
            ? 'Administrator sign in'
            : operation
              ? 'Sign in'
              : 'Sign in to view application'}
        </Link>
      </>
    );
  if (!challenge && !operation)
    return (
      <>
        <h1 className="focus:outline-solid focus:outline-3 focus:outline-ring focus:outline-offset-2 m-0 text-2xl font-semibold">
          Confirm your email
        </h1>
        <p role="alert">This link is unavailable. It may have expired or been replaced.</p>
        <p>
          <Link href="/auth/verify-email">Request a new verification link</Link>, or ask your
          inviting Administrator/operator for a new invitation.
        </p>
      </>
    );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError('');
    setFields({});
    if (operation) {
      const result = validateInvitationInput({ fullName, password, employeeNumber });
      if ('errors' in result) {
        setFields(result.errors);
        setPassword('');
        setVisible(false);
        setError('Check the highlighted fields before accepting your invitation.');
        requestAnimationFrame(() => status.current?.focus());
        return;
      }
    }
    setPending(true);
    let progressed = false;
    try {
      if (!operation) {
        // Commit the capability cookie in its own response before consuming the link.
        const prepared = await prepare();
        if (prepared?.error) {
          setError(prepared.error);
          return;
        }
        const result = await confirm(challenge);
        if ('error' in result) setError(result.error);
        else {
          progressed = true;
          if (window.location.search) window.history.replaceState(null, '', '/auth/email');
          if (result.purpose === 'verification') setDone(true);
          else setOperation(result);
        }
      } else {
        const result = await complete(operation.operationId, {
          fullName,
          password,
          employeeNumber,
        });
        if ('error' in result) setError(result.error);
        else {
          progressed = true;
          setPassword('');
          setDone(true);
        }
      }
    } catch {
      setError('Connection interrupted. Retry to resume safely.');
    } finally {
      setPassword('');
      setVisible(false);
      setPending(false);
      requestAnimationFrame(() =>
        progressed ? heading.current?.focus() : status.current?.focus()
      );
    }
  }
  return (
    <>
      <h1
        ref={heading}
        tabIndex={-1}
        className="focus:outline-solid focus:outline-3 focus:outline-ring focus:outline-offset-2 m-0 text-2xl font-semibold"
      >
        {operation ? 'Accept your invitation' : 'Confirm your email'}
      </h1>
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div
          ref={status}
          tabIndex={-1}
          role={error ? 'alert' : 'status'}
          className="text-sm text-muted-foreground focus:outline-solid focus:outline-3 focus:outline-ring focus:outline-offset-2"
        >
          {error ||
            (operation
              ? 'Email confirmed. Choose your own password to accept this invitation.'
              : 'Confirm this email to continue. Opening the link alone does not accept it.')}
          {error && Object.entries(fields).some(([, value]) => value) && (
            <ul>
              {Object.entries(fields)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <li key={key}>
                    <a
                      href={
                        key === 'fullName'
                          ? '#full-name'
                          : key === 'employeeNumber'
                            ? '#employee-number'
                            : '#new-password'
                      }
                    >
                      {value}
                    </a>
                  </li>
                ))}
            </ul>
          )}
        </div>
        {operation && (
          <>
            {operation.invitation && (
              <dl className="space-y-2">
                <dt className="text-sm font-medium">Invited email</dt>
                <dd className="m-0">{operation.invitation.email}</dd>
                <dt className="text-sm font-medium">Invited role</dt>
                <dd className="m-0">
                  {operation.invitation.role === 'administrator' ? 'Administrator' : 'Program Head'}
                </dd>
              </dl>
            )}
            <div className="space-y-2">
              <label htmlFor="full-name">Full name (required)</label>
              <Input
                id="full-name"
                name="fullName"
                required
                autoComplete="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                aria-invalid={!!fields.fullName}
                aria-describedby={fields.fullName ? 'name-error' : undefined}
              />
              {fields.fullName && (
                <p id="name-error" className="text-sm text-destructive">
                  {fields.fullName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="new-password">New password (required)</label>
              <Input
                id="new-password"
                name="password"
                required
                type={visible ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!fields.password}
                aria-describedby={
                  fields.password ? 'password-help password-error' : 'password-help'
                }
              />
              <Button
                type="button"
                variant="outline"
                aria-controls="new-password"
                aria-pressed={visible}
                aria-label={visible ? 'Hide password' : 'Show password'}
                onClick={() => setVisible(!visible)}
              >
                {visible ? 'Hide' : 'Show'}
              </Button>
              <p id="password-help" className="text-sm text-muted-foreground">
                Use at least 12 characters and at most 72 UTF-8 bytes. Spaces and passphrases are
                welcome.
              </p>
              <p id="password-error" className="text-sm text-destructive">
                {fields.password}
              </p>
            </div>
            <div className="space-y-2">
              <label htmlFor="employee-number">Employee number (optional)</label>
              <Input
                id="employee-number"
                name="employeeNumber"
                value={employeeNumber}
                onChange={(e) => setEmployeeNumber(e.target.value)}
                aria-invalid={!!fields.employeeNumber}
                aria-describedby={
                  fields.employeeNumber ? 'employee-help employee-error' : 'employee-help'
                }
              />
              <p id="employee-help" className="text-sm text-muted-foreground">
                Leave blank if you do not have it available.
              </p>
              {fields.employeeNumber && (
                <p id="employee-error" className="text-sm text-destructive">
                  {fields.employeeNumber}
                </p>
              )}
            </div>
          </>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending
            ? operation
              ? 'Accepting invitation…'
              : 'Confirming email…'
            : operation
              ? 'Accept invitation'
              : 'Confirm email'}
        </Button>
        {error && (
          <p className="text-sm">
            <Link href="/auth/verify-email">Request a new verification link</Link>. For an
            invitation, ask the inviting Administrator or operator for a new invitation.
          </p>
        )}
      </form>
    </>
  );
}
