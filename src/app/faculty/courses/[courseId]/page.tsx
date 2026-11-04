import { Suspense } from 'react';
import { AppShell } from '@/components/app-shell';
import { getOwnCourseDraft } from '@/features/content/courses';
import { DraftForm } from '../draft-form';
async function Detail({ params }: { params: Promise<{ courseId: string }> }) {
  const result = await getOwnCourseDraft((await params).courseId);
  return (
    <AppShell title={result.ok ? result.value.details.title || 'Untitled draft' : 'Course draft'}>
      {result.ok ? (
        <>
          <p>Draft · Revision 1</p>
          <DraftForm draft={result.value} />
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
