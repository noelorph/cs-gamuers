'use client';
import { useActionState, useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { submitSignIn } from './actions';
export function SignInForm() {
  const [email, setEmail] = useState('');
  const [error, action, pending] = useActionState(async (previous: string, form: FormData) => {
    try {
      return await submitSignIn(previous, form);
    } catch {
      return 'Sign-in is unavailable. Open the original HTTPS application page and try again.';
    }
  }, '');
  const alert = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (error) alert.current?.focus();
  }, [error, pending]);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="email">Email</label>
        <Input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="username"
          maxLength={254}
          required
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="password">Password</label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {error && (
        <p ref={alert} role="alert" tabIndex={-1} className="m-0 text-destructive outline-offset-4">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
