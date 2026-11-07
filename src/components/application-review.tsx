'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  applicationLabels,
  applicationError,
  type Application,
  type ApplicationDecision,
} from '@/features/accounts/application-types';
import { submitReview, readReview, releaseStudentNumber } from '@/app/admin/applications/actions';
import { paths } from '@/config/paths';
const checkLabels = {
  enrollment: 'I compared the name and student number with the enrollment list.',
  authorization: 'I checked authorization against existing school records.',
  employee_id: 'I verified identity in person using a school-issued employee ID.',
  email_owner: 'I confirmed that the verified application email belongs to the applicant.',
  error_verified: 'I verified the error before reopening this application.',
};
const decisionLabels = {
  approve: 'Approve application',
  needs_correction: 'Request correction',
  reject: 'Reject application',
  reopen: 'Reopen application',
};
const confirmLabels = {
  approve: 'Approve application',
  needs_correction: 'Send correction request',
  reject: 'Reject application',
  reopen: 'Reopen for review',
};
export function ApplicationReview({
  initial,
  administrator,
  queueHref,
}: {
  initial: Application;
  administrator: boolean;
  queueHref: string;
}) {
  const router = useRouter();
  const [application, setApplication] = useState<Application | null>(initial);
  const [choice, setChoice] = useState<ApplicationDecision['decision'] | ''>('');
  const [reason, setReason] = useState('');
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [stale, setStale] = useState(false);
  const [request, setRequest] = useState<ApplicationDecision | null>(null);
  const [releaseNumber, setReleaseNumber] = useState('');
  const [replacementNumber, setReplacementNumber] = useState('');
  const [numberReason, setNumberReason] = useState('');
  const [numberVerified, setNumberVerified] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const feedback = useRef<HTMLDivElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const reviewButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  function lostAccess() {
    setOpen(false);
    setApplication(null);
    router.replace(paths.login(administrator ? 'administrator' : 'faculty') + '?session=ended');
  }
  async function reload() {
    if (!application || pending) return;
    setPending(true);
    try {
      const result = await readReview(application.id);
      if (result.ok) {
        setApplication(result.value);
        setStale(false);
        setChoice('');
        setChecks({});
        setRequest(null);
        setError('');
        setMessage('Application reloaded. Review the current details before deciding.');
      } else if (result.code === 'forbidden') lostAccess();
      else setError(applicationError[result.code]);
    } catch {
      setError('Applications could not be loaded. Try again.');
    } finally {
      setPending(false);
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }
  function prepare() {
    if (!application || pending || stale) return;
    const required =
      choice === 'reopen'
        ? ['error_verified']
        : application.role === 'student'
          ? ['enrollment']
          : ['authorization', 'employee_id', 'email_owner'];
    if (
      !choice ||
      (choice !== 'approve' && (!reason.trim() || [...reason.trim()].length > 2000)) ||
      ((choice === 'approve' || choice === 'reopen') && required.some((key) => !checks[key]))
    ) {
      setError(
        'Choose a decision, complete the required verification checks, and provide a reason when requested.'
      );
      requestAnimationFrame(() => feedback.current?.focus());
      return;
    }
    setError('');
    const payload = {
      id: application.id,
      version: application.version,
      decision: choice,
      reason: choice === 'approve' ? '' : reason.trim(),
      attestations: checks,
    };
    if (
      !request ||
      JSON.stringify({ ...request, requestId: undefined }) !== JSON.stringify(payload)
    )
      setRequest({ ...payload, requestId: crypto.randomUUID() });
    setOpen(true);
  }
  async function commit() {
    if (!request || pending) return;
    setPending(true);
    setError('');
    setMessage('Checking the saved decision…');
    try {
      let result = await submitReview(request);
      // Retrying the identical decision ID resolves an uncertain response without a second decision.
      if (!result.ok && result.code === 'unavailable') result = await submitReview(request);
      if (result.ok) {
        setApplication(result.value);
        setOpen(false);
        setMessage('Decision saved. Decision email queued.');
        setChoice('');
        setRequest(null);
        router.refresh();
      } else if (result.code === 'forbidden') lostAccess();
      else {
        setOpen(false);
        setMessage('');
        setError(
          result.code === 'conflict'
            ? 'Application updated. Reload it before deciding.'
            : applicationError[result.code]
        );
        setStale(result.code === 'conflict');
      }
    } catch {
      setOpen(false);
      setMessage('');
      setError(
        'We could not confirm the result. Retry the same decision to check its saved state.'
      );
    } finally {
      setPending(false);
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }
  if (!application) return <p role="status">Your access has ended. Returning to sign in…</p>;
  const latestDecision = application?.history.find((event) =>
    /^application_(approved|needs_correction|rejected|reopened)$/.test(event.event)
  );
  const editable =
    application.status === 'pending' || (administrator && application.status === 'rejected');
  return (
    <Card>
      <CardContent className="space-y-6 [overflow-wrap:anywhere]">
        <div className="space-y-3">
          <Link href={queueHref}>Back to applications</Link>
          <h2
            ref={heading}
            tabIndex={-1}
            className="m-0 text-xl focus:outline-solid focus:outline-3 focus:outline-ring focus:outline-offset-2"
          >
            {application.full_name}
          </h2>
          <div className="flex flex-wrap gap-2">
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
            {application.email_verified && <Badge variant="success">Email verified</Badge>}
          </div>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2">
          {[
            ['Full name', application.full_name],
            [
              application.role === 'student' ? 'Student number' : 'Employee number',
              application.student_number ?? application.employee_number ?? 'Not provided',
            ],
            ['Email', application.email],
            ['Application role', application.role === 'student' ? 'Student' : 'Faculty'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="m-0 mt-1">{value}</dd>
            </div>
          ))}
        </dl>
        {application.replacement && (
          <p className="rounded-md bg-warning-surface p-4 text-warning">
            Replacement email awaiting verification. Approval and resubmission are unavailable.
          </p>
        )}
        {latestDecision && (
          <div className="space-y-2">
            <h3 className="text-base">Latest update</h3>
            <p className="whitespace-pre-wrap">{latestDecision.reason}</p>
            <time className="text-sm text-muted-foreground" dateTime={latestDecision.created_at}>
              {new Date(latestDecision.created_at).toLocaleString()}
            </time>
          </div>
        )}
        {administrator && application.delivery_state && (
          <p>
            {application.delivery_state === 'failed'
              ? 'Decision saved. Email delivery failed.'
              : application.delivery_state === 'sent'
                ? 'Decision email delivery recorded.'
                : 'Decision email queued.'}
          </p>
        )}
        <div
          ref={feedback}
          tabIndex={-1}
          role={error ? 'alert' : 'status'}
          className="focus:outline-solid focus:outline-3 focus:outline-ring focus:outline-offset-2"
        >
          {error || message}
        </div>
        {(stale || error) && (
          <Button variant="outline" disabled={pending} onClick={reload}>
            Reload current application
          </Button>
        )}
        {editable && (
          <form
            className="space-y-6"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              prepare();
            }}
          >
            <fieldset className="m-0 min-w-0 space-y-3 border-0 p-0" disabled={pending || stale}>
              <legend className="mb-3 font-medium">Verify against school records</legend>
              {(application.status === 'rejected'
                ? (['error_verified'] as const)
                : application.role === 'student'
                  ? (['enrollment'] as const)
                  : (['authorization', 'employee_id', 'email_owner'] as const)
              ).map((key) => (
                <label
                  key={key}
                  className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md border border-solid border-input p-3 has-checked:border-primary has-checked:bg-accent"
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-primary"
                    checked={checks[key] ?? false}
                    onChange={(e) => setChecks({ ...checks, [key]: e.target.checked })}
                  />
                  <span>{checkLabels[key]}</span>
                </label>
              ))}
              <p className="text-sm text-muted-foreground">
                These checks record your external verification. No document upload is needed.
              </p>
            </fieldset>
            {application.status === 'pending' ? (
              <fieldset className="m-0 min-w-0 space-y-3 border-0 p-0" disabled={pending || stale}>
                <legend className="mb-3 font-medium">Decision</legend>
                {(['approve', 'needs_correction', 'reject'] as const).map((value) => (
                  <label
                    key={value}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-solid border-input p-3 has-checked:border-primary has-checked:bg-accent"
                  >
                    <input
                      type="radio"
                      name="decision"
                      value={value}
                      className="accent-primary"
                      checked={choice === value}
                      onChange={() => setChoice(value)}
                    />
                    <span>{decisionLabels[value]}</span>
                  </label>
                ))}
              </fieldset>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={pending || stale}
                onClick={() => setChoice('reopen')}
              >
                Reopen application
              </Button>
            )}
            {choice && choice !== 'approve' && (
              <div className="space-y-2">
                <label htmlFor="decision-reason">Reason (required)</label>
                <Textarea
                  id="decision-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  aria-describedby="reason-help reason-count"
                  disabled={pending}
                />
                <p id="reason-help" className="text-sm text-muted-foreground">
                  Explain what needs correcting or why the application cannot be approved.
                </p>
                <p id="reason-count" className="text-sm text-muted-foreground">
                  {[...reason].length} / 2,000 characters
                </p>
              </div>
            )}
            <Button ref={reviewButton} className="w-full" disabled={pending || stale}>
              {pending ? 'Saving decision…' : 'Review decision'}
            </Button>
          </form>
        )}
        {administrator && application.role === 'student' && application.status !== 'approved' && (
          <details className="space-y-4">
            <summary className="cursor-pointer py-3 font-medium">
              Verify a student-number correction
            </summary>
            <p>
              Only release a mistaken claim after checking the school record. A current number needs
              a verified, unclaimed replacement in the same change.
            </p>
            <form
              className="space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                if (pending) return;
                setPending(true);
                setError('');
                try {
                  const result = await releaseStudentNumber({
                    id: application.id,
                    version: application.version,
                    studentNumber: releaseNumber,
                    replacementNumber,
                    reason: numberReason,
                    verified: numberVerified,
                  });
                  if (result.ok) {
                    setApplication(result.value);
                    setMessage('Student-number correction saved.');
                    router.refresh();
                  } else if (result.code === 'forbidden') lostAccess();
                  else setError(applicationError[result.code]);
                } catch {
                  setError(
                    'We could not confirm the result. Reload the application before retrying.'
                  );
                } finally {
                  setPending(false);
                  requestAnimationFrame(() => feedback.current?.focus());
                }
              }}
            >
              <label className="block space-y-2">
                Claim to release
                <select
                  required
                  className="box-border min-h-11 w-full rounded-md border border-solid border-input bg-background px-3 text-base"
                  value={releaseNumber}
                  onChange={(e) => setReleaseNumber(e.target.value)}
                >
                  <option value="">Choose a number</option>
                  {application.retained_numbers?.map((number) => (
                    <option key={number} value={number}>
                      {number}
                      {number === application.student_number ? ' (current)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                Verified replacement number (required for current number)
                <Input
                  value={replacementNumber}
                  onChange={(e) => setReplacementNumber(e.target.value)}
                  required={releaseNumber === application.student_number}
                />
              </label>
              <label className="block space-y-2">
                Number correction reason (required)
                <Textarea
                  required
                  value={numberReason}
                  onChange={(e) => setNumberReason(e.target.value)}
                />
              </label>
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  required
                  checked={numberVerified}
                  onChange={(e) => setNumberVerified(e.target.checked)}
                />
                I verified the mistaken number and any replacement against school records.
              </label>
              <Button disabled={pending}>Save verified number correction</Button>
            </form>
          </details>
        )}
        <Dialog
          open={open}
          onOpenChange={(value) => {
            if (!pending) setOpen(value);
          }}
        >
          <DialogContent
            className="[overflow-wrap:anywhere]"
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              cancel.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              reviewButton.current?.focus();
            }}
            showCloseButton={!pending}
          >
            <DialogTitle>
              {choice === 'approve'
                ? `Approve ${application.full_name}'s ${application.role} application?`
                : choice === 'needs_correction'
                  ? `Request corrections from ${application.full_name}?`
                  : choice === 'reject'
                    ? `Reject ${application.full_name}'s application?`
                    : `Reopen ${application.full_name}'s application?`}
            </DialogTitle>
            <DialogDescription>
              {choice === 'approve'
                ? `An active account will receive ${application.role === 'student' ? 'Student' : 'Faculty'} access. ${application.email}`
                : choice === 'needs_correction'
                  ? 'The applicant can correct this application and resubmit.'
                  : choice === 'reject'
                    ? 'The applicant cannot resubmit unless an Administrator reopens it.'
                    : 'Return this application to Pending review. This does not approve or reactivate the account.'}
            </DialogDescription>
            {choice !== 'approve' && (
              <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{reason}</p>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button ref={cancel} variant="outline" disabled={pending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                variant={choice === 'reject' ? 'destructive' : 'default'}
                disabled={pending}
                onClick={commit}
              >
                {pending ? 'Saving decision…' : choice ? confirmLabels[choice] : 'Confirm'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
