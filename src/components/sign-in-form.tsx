'use client';
import { useActionState, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { SignInFeedback } from '@/features/accounts/sign-in-action';
export function SignInForm({
  submit,
}: {
  submit: (previous: SignInFeedback, form: FormData) => Promise<SignInFeedback>;
}) {
  const [visible, setVisible] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const password = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [error, action, pending] = useActionState(
    async (previous: SignInFeedback, form: FormData) => {
      try {
        return await submit(previous, form);
      } catch {
        return { message: 'Sign-in is unavailable right now. Try again.' };
      } finally {
        if (password.current) password.current.value = '';
        setVisible(false);
      }
    },
    { message: '' }
  );
  const alert = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error.message) alert.current?.focus();
  }, [error, pending]);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email (required)
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError('');
          }}
          onInvalid={(event) =>
            setEmailError(
              event.currentTarget.validity.valueMissing
                ? 'Enter your email address.'
                : 'Enter a valid email address.'
            )
          }
          aria-invalid={!!emailError}
          autoCapitalize="none"
          spellCheck={false}
          aria-describedby={emailError ? 'email-help email-error' : 'email-help'}
          autoComplete="username"
          maxLength={254}
          required
        />
        {emailError && (
          <p id="email-error" className="m-0 text-sm text-destructive">
            {emailError}
          </p>
        )}
        <p id="email-help" className="m-0 text-sm text-muted-foreground">
          Use the email registered to your account.
        </p>
      </div>
      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password (required)
        </label>
        <div className="flex min-w-0 gap-2">
          <Input
            ref={password}
            id="password"
            name="password"
            type={visible ? 'text' : 'password'}
            aria-describedby={passwordError ? 'password-help password-error' : 'password-help'}
            aria-invalid={!!passwordError}
            onChange={() => setPasswordError('')}
            onInvalid={() => setPasswordError('Enter your password.')}
            autoComplete="current-password"
            required
          />
          <Button
            type="button"
            variant="outline"
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-controls="password"
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? 'Hide' : 'Show'}
          </Button>
        </div>
        {passwordError && (
          <p id="password-error" className="m-0 text-sm text-destructive">
            {passwordError}
          </p>
        )}
        <p id="password-help" className="m-0 text-sm text-muted-foreground">
          Use your CS-GAMUERS password.
        </p>
      </div>
      {error.message && (
        <p ref={alert} role="alert" tabIndex={-1} className="m-0 text-destructive outline-offset-4">
          {error.message}
          {error.destination && (
            <>
              {' '}
              <Link href={error.destination} className="text-primary">
                {error.destination === '/admin/sign-in'
                  ? 'Administrator sign in'
                  : 'Standard sign in'}
              </Link>
            </>
          )}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
