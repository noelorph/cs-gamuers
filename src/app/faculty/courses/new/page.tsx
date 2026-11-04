import { Suspense } from 'react';
import { randomUUID } from 'node:crypto';
import { connection } from 'next/server';
import { AppShell } from '@/components/app-shell';
import { requireActor } from '@/lib/access';
import { DraftForm } from '../draft-form';
async function NewDraft() {
  await connection();
  let ownerId: string;
  try {
    ownerId = (await requireActor('faculty')).id;
  } catch {
    return (
      <AppShell title="New draft">
        <p role="alert">Sign in with an approved Faculty account to create a draft.</p>
      </AppShell>
    );
  }
  return (
    <AppShell title="New draft">
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
