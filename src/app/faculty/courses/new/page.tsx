import { Suspense } from 'react';
import { randomUUID } from 'node:crypto';
import { connection } from 'next/server';
import { AppShell, facultyNav } from '@/components/app-shell';
import { requireActor } from '@/lib/access';
import { DraftForm } from '../draft-form';
async function NewDraft() {
  await connection();
  let ownerId: string;
  try {
    ownerId = (await requireActor('faculty')).id;
  } catch {
    return (
      <AppShell title="New draft" nav={facultyNav}>
        <p role="alert">Sign in with an approved Faculty account to create a draft.</p>
      </AppShell>
    );
  }
  return (
    <AppShell title="New draft" nav={facultyNav}>
      <DraftForm createId={randomUUID()} ownerId={ownerId} />
    </AppShell>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Loading draft…</p>}>
      <NewDraft />
    </Suspense>
  );
}
