import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { createRequestClient } from '@/lib/supabase/server';
import { paths } from '@/config/paths';
async function Status() {
  let status;
  try {
    const result = await (await createRequestClient()).rpc('account_status');
    if (result.error) throw Error();
    status = result.data?.[0];
  } catch {
    redirect(paths.signIn);
  }
  if (!status) redirect(paths.signIn);
  const labels = {
    pending: 'Pending review',
    needs_correction: 'Needs correction',
    rejected: 'Application rejected',
    approved: 'Approved',
  };
  return (
    <AppShell title="Account status">
      <h2>{status.active ? labels[status.application_status] : 'Account deactivated'}</h2>
      <p>
        {status.active
          ? 'Your application status determines when you can access learning or staff features.'
          : 'Contact an Administrator about reactivation. Your saved records are retained.'}
      </p>
    </AppShell>
  );
}
export default function StatusPage() {
  return (
    <Suspense fallback={<p role="status">Loading account status…</p>}>
      <Status />
    </Suspense>
  );
}
