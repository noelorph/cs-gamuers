'use client';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { validateInvitationInput } from '@/features/accounts/validation';

type Confirmation = { operationId: string; purpose: 'verification' | 'invitation' };
type Props = {
  challenge: string;
  prepare: () => Promise<void | { error: string }>;
  confirm: (challenge: string) => Promise<Confirmation | { error: string }>;
  complete: (
    id: string,
    input: { fullName: string; password: string }
  ) => Promise<{ complete: true } | { error: string }>;
};
export function EmailForm({ challenge, prepare, confirm, complete }: Props) {
  const [operation, setOperation] = useState<Confirmation | null>(null);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<{ fullName?: string; password?: string }>({});
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const status = useRef<HTMLParagraphElement>(null);
  if (done)
    return (
      <p role="status">
        Email confirmed. Sign in with your password when the operator confirms your account is
        ready.
      </p>
    );
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError('');
    setFields({});
    if (operation) {
      const result = validateInvitationInput({ fullName, password });
      if ('errors' in result) {
        setFields(result.errors);
        return;
      }
    }
    setPending(true);
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
        else if (result.purpose === 'verification') setDone(true);
        else setOperation(result);
      } else {
        const result = await complete(operation.operationId, { fullName, password });
        if ('error' in result) setError(result.error);
        else {
          setPassword('');
          setDone(true);
        }
      }
    } catch {
      setError('Connection interrupted. Retry to resume safely.');
    } finally {
      setPending(false);
      requestAnimationFrame(() => status.current?.focus());
    }
  }
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <p
        ref={status}
        tabIndex={-1}
        role={error ? 'alert' : 'status'}
        className="text-sm text-muted-foreground outline-none"
      >
        {error ||
          (operation
            ? 'Email confirmed. Choose your own password to accept this invitation.'
            : 'Confirm this email to continue. Opening the link alone does not accept it.')}
      </p>
      {operation && (
        <>
          <div className="space-y-2">
            <label htmlFor="full-name">Full name</label>
            <Input
              id="full-name"
              name="fullName"
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
            <label htmlFor="new-password">New password</label>
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!fields.password}
              aria-describedby="password-help password-error"
            />
            <p id="password-help" className="text-sm text-muted-foreground">
              Use at least 12 characters and at most 72 UTF-8 bytes. Spaces and passphrases are
              welcome.
            </p>
            <p id="password-error" className="text-sm text-destructive">
              {fields.password}
            </p>
          </div>
        </>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Working…' : operation ? 'Accept invitation' : 'Confirm email'}
      </Button>
    </form>
  );
}
