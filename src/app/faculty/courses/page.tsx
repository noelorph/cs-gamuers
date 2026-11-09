import { Suspense } from 'react';
import Link from 'next/link';
import { AppShell, facultyNav } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listOwnCourseDrafts } from '@/features/content/courses';
import { paths } from '@/config/paths';
async function Drafts() {
  const result = await listOwnCourseDrafts();
  return (
    <AppShell title="Course drafts" nav={facultyNav}>
      <p className="mt-4">
        <Button asChild>
          <Link href={paths.newCourse}>New draft</Link>
        </Button>
      </p>
      {!result.ok ? (
        <p role="alert">
          Drafts are unavailable. Sign in again if your session expired, then retry.
        </p>
      ) : result.value.length === 0 ? (
        <p className="rounded-md border border-dashed border-input bg-card p-6 text-center text-muted-foreground">
          No course drafts yet.
        </p>
      ) : (
        <div className="mt-4 grid gap-4">
          {result.value.map((draft) => (
            <Card key={draft.id} className="shadow-sm transition-shadow hover:shadow-overlay">
              <CardContent className="grid gap-2">
                <Badge variant="secondary">Draft · Revision 1</Badge>
                <Link
                  className="break-words text-lg font-semibold text-primary hover:underline"
                  href={paths.courseDraft(draft.id)}
                >
                  {draft.details.title || 'Untitled draft'}
                </Link>
                <p className="m-0 whitespace-pre-wrap break-words">{draft.details.description}</p>
                <span className="text-sm text-muted-foreground">
                  {draft.details.primaryTopic ?? 'No topic selected'} ·{' '}
                  {draft.details.difficulty ?? 'No difficulty selected'}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Loading drafts…</p>}>
      <Drafts />
    </Suspense>
  );
}
