'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { paths } from '@/config/paths';
import {
  applicationLabels,
  applicationError,
  type ApplicationResult,
} from '@/features/accounts/application-types';
import {
  readApplication,
  saveCorrection,
  resubmitCorrection,
  verifyReplacement,
  cancelReplacement,
} from './actions';
export function ApplicationStatus({ initial }: { initial: ApplicationResult }) {
  const [result, setResult] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState('');
  const [number, setNumber] = useState('');
  const [replacementEmail, setReplacementEmail] = useState('');
  const feedback = useRef<HTMLDivElement>(null);
  const application = result.ok ? result.value : null;
  useEffect(() => {
    if (!editing) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [editing]);
  async function run(
    action: () => Promise<ApplicationResult>,
    success: string,
    closeEditor = false
  ) {
    if (pending) return;
    setPending(true);
    setError('');
    setMessage('Checking the result…');
    try {
      const next = await action();
      if (next.ok) {
        setResult(next);
        if (closeEditor) setEditing(false);
        setMessage(success);
      } else if (next.code === 'forbidden') {
        setResult(next);
        window.location.assign(paths.signIn + '?session=ended');
      } else {
        setError(applicationError[next.code]);
        setMessage('');
      }
    } catch {
      setMessage('');
      setError(
        'Connection interrupted. Your edits are kept. Refresh the saved status before retrying.'
      );
    } finally {
      setPending(false);
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }
  const latestDecision = application?.history.find((event) =>
    /^application_(approved|needs_correction|rejected|reopened)$/.test(event.event)
  );
  function edit() {
    if (!application) return;
    setFullName(application.full_name);
    setNumber(application.student_number ?? application.employee_number ?? '');
    setEditing(true);
    setFields({});
  }
  return (
    <div className="min-h-dvh bg-page">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="flex flex-wrap items-center justify-between gap-4 border-0 border-b border-solid border-border bg-card px-4 py-6 md:px-6">
        <Link
          href="/"
          className="text-lg font-semibold text-primary no-underline"
          onNavigate={(event) => {
            if (editing && !window.confirm('Discard unsaved changes and leave this application?'))
              event.preventDefault();
          }}
        >
          CS-GAMUERS
        </Link>
        <form action={paths.signOut} method="post">
          <Button variant="outline">Sign out</Button>
        </form>
      </header>
      <main
        id="main"
        className="mx-auto box-border max-w-[720px] space-y-6 px-4 py-8 md:px-6 [overflow-wrap:anywhere]"
      >
        <h1 className="m-0 text-2xl font-semibold">Your application</h1>
        <div
          ref={feedback}
          role={error ? 'alert' : 'status'}
          tabIndex={-1}
          className="focus:outline-solid focus:outline-3 focus:outline-ring focus:outline-offset-2"
        >
          {error || message}
          {Object.entries(fields).length > 0 && (
            <ul>
              {Object.entries(fields).map(([key, value]) => (
                <li key={key}>
                  <a href={key === 'name' ? '#application-name' : '#application-number'}>{value}</a>
                </li>
              ))}
            </ul>
          )}
        </div>
        {!application ? (
          <>
            <p role="alert">We could not load your application. Try again.</p>
            <Button onClick={() => run(readApplication, 'Status refreshed.')} disabled={pending}>
              Try again
            </Button>
          </>
        ) : (
          <>
            <p>{application.role === 'student' ? 'Student' : 'Faculty'} application</p>
            <Card>
              <CardContent className="space-y-4">
                <h2 className="m-0 text-lg">
                  <Badge
                    variant={
                      application.status === 'approved'
                        ? 'success'
                        : application.status === 'rejected'
                          ? 'destructive'
                          : 'warning'
                    }
                  >
                    {applicationLabels[application.status]}
                  </Badge>
                </h2>
                <p>
                  {application.status === 'pending'
                    ? 'A reviewer will check your application against school records.'
                    : application.status === 'needs_correction'
                      ? 'Correct the same application, then resubmit it for review.'
                      : application.status === 'rejected'
                        ? 'If you believe this is an error, contact an Administrator. Only an Administrator can reopen this application.'
                        : 'You can continue to your approved account.'}
                </p>
                <p>
                  {application.email_verified
                    ? 'Email verified'
                    : 'Email proof is required before approval'}
                </p>
                {latestDecision && (
                  <div className="space-y-2">
                    <p className="font-medium">
                      {latestDecision.event === 'application_reopened'
                        ? 'An Administrator reopened this application for review.'
                        : 'Latest application update'}
                    </p>
                    <p className="whitespace-pre-wrap">{latestDecision.reason}</p>
                    <time dateTime={latestDecision.created_at}>
                      {new Date(latestDecision.created_at).toLocaleString('en-PH', {
                        timeZone: 'Asia/Manila',
                        timeZoneName: 'shortOffset',
                      })}
                    </time>
                  </div>
                )}
                <dl className="grid gap-2">
                  <dt className="font-medium">Full name</dt>
                  <dd className="m-0">{application.full_name}</dd>
                  <dt className="font-medium">
                    {application.role === 'student' ? 'Student number' : 'Employee number'}
                  </dt>
                  <dd className="m-0">
                    {application.student_number ?? application.employee_number ?? 'Not provided'}
                  </dd>
                  <dt className="font-medium">Current email</dt>
                  <dd className="m-0">{application.email}</dd>
                </dl>
              </CardContent>
            </Card>
            {editing && (
              <Card>
                <CardContent>
                  <form
                    className="space-y-5"
                    noValidate
                    onSubmit={(event) => {
                      event.preventDefault();
                      const errors: Record<string, string> = {};
                      if (!fullName.trim() || [...fullName.trim()].length > 200)
                        errors.name = 'Enter a name of at most 200 characters.';
                      if (
                        (application.role === 'student' && !number.trim()) ||
                        [...number.trim()].length > 50
                      )
                        errors.number = 'Enter a number of at most 50 characters.';
                      setFields(errors);
                      if (Object.keys(errors).length) {
                        setError('Check the highlighted fields.');
                        requestAnimationFrame(() => feedback.current?.focus());
                        return;
                      }
                      void run(
                        () =>
                          saveCorrection(application.version, {
                            fullName,
                            studentNumber: application.role === 'student' ? number : null,
                            employeeNumber: application.role === 'faculty' ? number || null : null,
                          }),
                        'Changes saved.',
                        true
                      );
                    }}
                  >
                    <h2 className="text-lg">Edit application</h2>
                    <p>Role: {application.role === 'student' ? 'Student' : 'Faculty'}</p>
                    <div className="space-y-2">
                      <label htmlFor="application-name">Full name (required)</label>
                      <Input
                        id="application-name"
                        disabled={pending}
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        aria-invalid={!!fields.name}
                        aria-describedby="name-error"
                      />
                      <p id="name-error" className="text-destructive">
                        {fields.name}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="application-number">
                        {application.role === 'student'
                          ? 'Student number (required)'
                          : 'Employee number (optional)'}
                      </label>
                      <Input
                        id="application-number"
                        disabled={pending}
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        aria-invalid={!!fields.number}
                        aria-describedby="number-help number-error"
                      />
                      <p id="number-help" className="text-sm text-muted-foreground">
                        {application.role === 'student'
                          ? 'Keep all leading zeros. Previous numbers remain reserved until an Administrator verifies a correction.'
                          : 'Leave blank if not available.'}
                      </p>
                      <p id="number-error" className="text-destructive">
                        {fields.number}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button disabled={pending}>
                        {pending ? 'Saving changes…' : 'Save changes'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={pending}
                        onClick={() => {
                          if (window.confirm('Discard unsaved changes?')) setEditing(false);
                        }}
                      >
                        Cancel editing
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
            {['pending', 'needs_correction'].includes(application.status) && (
              <Card>
                <CardContent className="space-y-4">
                  <h2 className="text-lg">Change email address</h2>
                  <p>Current email: {application.email}</p>
                  {application.replacement ? (
                    <>
                      <p className="font-medium">Replacement email awaiting verification</p>
                      <p>{application.replacement.email}</p>
                      <p>
                        Your current email stays in place until you confirm the replacement. After
                        confirmation, sign in again with the new email.
                      </p>
                      <Button
                        variant="outline"
                        disabled={pending}
                        onClick={() =>
                          run(
                            () => cancelReplacement(application.version),
                            'Replacement email cancelled. Your current email is unchanged.'
                          )
                        }
                      >
                        Cancel replacement email
                      </Button>
                    </>
                  ) : (
                    <form
                      className="space-y-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void run(
                          () => verifyReplacement(application.version, replacementEmail),
                          'Replacement email verification queued.'
                        );
                      }}
                    >
                      <label htmlFor="replacement-email">Replacement email (required)</label>
                      <Input
                        id="replacement-email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        value={replacementEmail}
                        onChange={(e) => setReplacementEmail(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Verify ownership with the new email link. Students must use
                        @caloocan.sti.edu.ph.
                      </p>
                      <Button disabled={pending}>Verify replacement email</Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="flex flex-wrap gap-3">
              {!editing && ['pending', 'needs_correction'].includes(application.status) && (
                <Button onClick={edit}>Edit application</Button>
              )}
              {!editing && application.status === 'needs_correction' && (
                <Button
                  onClick={() =>
                    run(
                      () => resubmitCorrection(application.version),
                      'Application resubmitted for review.'
                    )
                  }
                  disabled={pending}
                >
                  Resubmit for review
                </Button>
              )}
              {application.status === 'approved' && (
                <Button asChild>
                  <Link href={paths.roleHome(application.role)}>Continue to your account</Link>
                </Button>
              )}
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => {
                  if (
                    !editing ||
                    window.confirm('Discard unsaved changes and reload the current application?')
                  )
                    void run(readApplication, 'Status refreshed.', true);
                }}
              >
                {error ? 'Reload current application' : 'Refresh status'}
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
