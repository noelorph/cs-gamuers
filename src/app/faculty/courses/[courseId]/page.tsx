import { Suspense } from 'react';
import { Badge } from '@/components/ui/badge';
import { AppShell } from '@/components/app-shell';
import { getOwnCourseDraft } from '@/features/content/courses';
import { DraftForm } from '../draft-form';
async function Detail({ params }: { params: Promise<{ courseId: string }> }) {
  const result = await getOwnCourseDraft((await params).courseId);
  return (
    <AppShell title={result.ok ? result.value.details.title || 'Untitled draft' : 'Course draft'}>
      {result.ok ? (
        <>
          <Badge variant="secondary" className="mt-4">
            Draft · Revision 1
          </Badge>
          <DraftForm key={result.value.id} draft={result.value} />
        </>
      ) : (
        <p role="alert">Draft unavailable.</p>
      )}
    </AppShell>
  );
}
export default function Page({ params }: { params: Promise<{ courseId: string }> }) {
  return (
    <Suspense fallback={<p role="status">Loading draft…</p>}>
      <Detail params={params} />
    </Suspense>
  );
}
