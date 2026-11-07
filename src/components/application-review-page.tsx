import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireActor } from '@/lib/access';
import { AppShell, adminNav, facultyNav } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApplication, listApplications } from '@/features/accounts/applications';
import { applicationLabels } from '@/features/accounts/application-types';
import type { ApplicationStatus } from '@/features/accounts/types';
import { paths } from '@/config/paths';
import { ApplicationReview } from './application-review';
type Query = Promise<Record<string, string | string[] | undefined>>;
async function Review({
  role,
  searchParams,
}: {
  role: 'faculty' | 'administrator';
  searchParams: Query;
}) {
  try {
    await requireActor(role);
  } catch {
    redirect(paths.login(role));
  }
  const query = await searchParams;
  const status: ApplicationStatus =
    typeof query.status === 'string' && Object.hasOwn(applicationLabels, query.status)
      ? (query.status as ApplicationStatus)
      : 'pending';
  const filterRole =
    role === 'administrator' && (query.role === 'student' || query.role === 'faculty')
      ? query.role
      : undefined;
  const id =
    typeof query.application === 'string' && /^[a-f0-9-]{36}$/i.test(query.application)
      ? query.application
      : undefined;
  const [queue, detail] = await Promise.all([
    listApplications(status, filterRole),
    id ? getApplication(id) : Promise.resolve(null),
  ]);
  if (
    (!queue.ok && queue.code === 'forbidden') ||
    (detail && !detail.ok && detail.code === 'forbidden')
  )
    redirect(paths.login(role));
  const base = paths.applications(role);
  const filters = new URLSearchParams({
    status,
    ...(filterRole ? { role: filterRole } : {}),
  }).toString();
  return (
    <AppShell
      title={role === 'faculty' ? 'Student applications' : 'Applications'}
      nav={role === 'faculty' ? facultyNav : adminNav}
    >
      <p className="text-muted-foreground">
        {role === 'faculty'
          ? 'Review Student applications against the enrollment list.'
          : 'Review Student and Faculty applications against school records.'}
      </p>
      <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] [overflow-wrap:anywhere]">
        <section aria-label="Application queue" className="space-y-4">
          <Card>
            <CardContent>
              <form action={base} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="review-status">Status</label>
                  <select
                    id="review-status"
                    name="status"
                    defaultValue={status}
                    className="box-border min-h-11 w-full rounded-md border border-solid border-input bg-background px-3 text-base"
                  >
                    {Object.entries(applicationLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {role === 'administrator' && (
                  <div className="space-y-2">
                    <label htmlFor="review-role">Applicant role</label>
                    <select
                      id="review-role"
                      name="role"
                      defaultValue={filterRole ?? ''}
                      className="box-border min-h-11 w-full rounded-md border border-solid border-input bg-background px-3 text-base"
                    >
                      <option value="">All applicants</option>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                )}
                <Button variant="outline">Apply filters</Button>
              </form>
            </CardContent>
          </Card>
          {!queue.ok ? (
            <p role="alert">
              Applications could not be loaded. <Link href={base}>Try again</Link>
            </p>
          ) : queue.value.length === 0 ? (
            <p>
              {status === 'pending' && !filterRole
                ? 'No applications are waiting for review'
                : 'No applications match these filters'}
              . <Link href={base}>Reset filters</Link>
            </p>
          ) : (
            queue.value.map((a) => (
              <Card key={a.id} className={a.id === id ? 'border-primary bg-accent' : ''}>
                <CardContent className="space-y-2">
                  <p className="m-0 font-semibold">{a.full_name}</p>
                  <p className="m-0 text-sm">{applicationLabels[a.status]}</p>
                  <p className="m-0 text-sm text-muted-foreground">
                    {role === 'administrator'
                      ? `${a.role === 'student' ? 'Student' : 'Faculty'} · `
                      : ''}
                    Submitted {new Date(a.applied_at).toLocaleDateString()}
                  </p>
                  <Link href={`${base}?${filters}&application=${a.id}#application-detail`}>
                    Review {a.full_name}
                  </Link>
                </CardContent>
              </Card>
            ))
          )}
        </section>
        <section id="application-detail" aria-label="Application detail" className="min-w-0">
          {!detail ? (
            <Card>
              <CardContent>
                <p>Select an application to review its details.</p>
              </CardContent>
            </Card>
          ) : !detail.ok ? (
            <p role="alert">
              Application could not be loaded.{' '}
              <Link href={`${base}?${filters}&application=${id}`}>Try again</Link>
            </p>
          ) : (
            <ApplicationReview
              key={detail.value.id}
              initial={detail.value}
              administrator={role === 'administrator'}
              queueHref={`${base}?${filters}`}
            />
          )}
        </section>
      </div>
    </AppShell>
  );
}
export function ApplicationReviewPage(props: {
  role: 'faculty' | 'administrator';
  searchParams: Query;
}) {
  return (
    <Suspense fallback={<p role="status">Loading applications…</p>}>
      <Review {...props} />
    </Suspense>
  );
}
