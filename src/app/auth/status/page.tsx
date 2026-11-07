import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getApplication } from '@/features/accounts/applications';
import { paths } from '@/config/paths';
import { ApplicationStatus } from './status';
async function Status() {
  const result = await getApplication();
  if (!result.ok && result.code === 'forbidden') redirect(paths.signIn + '?session=ended');
  return <ApplicationStatus initial={result} />;
}
export const metadata: Metadata = { title: 'Your application | CS-GAMUERS' };
export default function StatusPage() {
  return (
    <Suspense fallback={<p role="status">Loading your application…</p>}>
      <Status />
    </Suspense>
  );
}
