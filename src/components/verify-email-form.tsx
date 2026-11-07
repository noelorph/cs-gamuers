'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { VerificationResult } from '@/features/accounts/registration';
export function VerifyEmailForm({
  initialEmail = '',
  queued = false,
  resend,
}: {
  initialEmail?: string;
  queued?: boolean;
  resend: (email: string) => Promise<VerificationResult>;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [message, setMessage] = useState(
    queued ? 'Verification email queued. Delivery may take a moment.' : ''
  );
  const [cooldown, setCooldown] = useState(queued);
  const feedback = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (queued) {
      heading.current?.focus();
      document.title = 'Check your email | CS-GAMUERS';
    }
  }, [queued]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => {
      setCooldown(false);
      setMessage('You can request a new link now.');
    }, 60_000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || cooldown) return;
    setError('');
    setMessage('');
    setInvalid(false);
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setInvalid(true);
      setError('Enter a valid email address.');
      requestAnimationFrame(() => feedback.current?.focus());
      return;
    }
    setPending(true);
    try {
      const result = await resend(email);
      if (result.ok) {
        setMessage('If this address can be verified, a new link will be queued.');
        setCooldown(true);
      } else {
        setInvalid(result.code === 'invalid_input');
        setError(
          result.code === 'throttled'
            ? 'Too many verification requests. Wait before trying again.'
            : result.code === 'invalid_input'
              ? 'Enter a valid email address.'
              : 'We could not request a verification email. Try again.'
        );
      }
    } catch {
      setError('We could not request a verification email. Try again.');
    } finally {
      setPending(false);
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }
  return (
    <>
      <h1
        ref={heading}
        tabIndex={-1}
        className="focus:outline-solid focus:outline-3 focus:outline-ring focus:outline-offset-2 m-0 text-2xl font-semibold leading-tight"
      >
        Check your email
      </h1>
      <p>
        If this address is eligible for verification, a link will be queued. Open the latest email
        on the demonstration network.
      </p>
      <p className="text-sm text-muted-foreground">
        Links expire 30 minutes after issuance. A new link replaces the previous one. Email
        verification still requires application approval.
      </p>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <div
          ref={feedback}
          role={error ? 'alert' : 'status'}
          tabIndex={-1}
          className="focus:outline-solid focus:outline-3 focus:outline-ring focus:outline-offset-2"
        >
          {error || message}
          {invalid && (
            <p className="mb-0">
              <a href="#verification-email">Check email</a>
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <label htmlFor="verification-email" className="text-sm font-medium">
            Email (required)
          </label>
          <Input
            id="verification-email"
            name="email"
            type="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={invalid}
            aria-describedby={invalid ? 'verification-error' : undefined}
            required
          />
          {invalid && (
            <p id="verification-error" className="m-0 text-sm text-destructive">
              Enter a valid email address.
            </p>
          )}
        </div>
        <Button disabled={pending || cooldown} aria-describedby="resend-help">
          {pending ? 'Requesting link…' : 'Request a new link'}
        </Button>
        <p id="resend-help" className="m-0 text-sm text-muted-foreground">
          {cooldown
            ? 'Wait at least 60 seconds before another request.'
            : 'Request a new link when ready. Requests are limited to five per hour.'}
        </p>
      </form>
      <p className="text-sm">
        <Link href="/auth/sign-in">Sign in to view application</Link>
      </p>
      <p className="text-sm text-muted-foreground">
        No email access or an invitation problem? Ask an Administrator or your inviting operator for
        help.
      </p>
    </>
  );
}
