import { Suspense, type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { requireActor } from '@/lib/access';
import { createRequestClient } from '@/lib/supabase/server';
import { paths } from '@/config/paths';
import type { Role } from '@/features/accounts/types';
import { Button } from './ui/button';
export const roleLabels: Record<Role, string> = {
  student: 'Student',
  faculty: 'Faculty',
  program_head: 'Program Head',
  administrator: 'Administrator',
};
export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="box-border flex flex-wrap items-center justify-between gap-4 border-0 border-b border-solid border-border px-4 py-4 md:px-6 lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col lg:items-start lg:border-b-0 lg:border-r lg:py-6">
        <span className="font-semibold">CS-GAMUERS</span>
        <form action={paths.signOut} method="post">
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </header>
      <main id="main" className="box-border min-w-0 max-w-[1200px] px-4 py-6 md:px-6 lg:ml-64">
        <h1 className="m-0 text-2xl font-semibold">{title}</h1>
        {children}
      </main>
    </>
  );
}
async function Destination({ role }: { role: Role }) {
  let destination: string | null = null;
  try {
    await requireActor(role);
  } catch {
    try {
      const result = await (await createRequestClient()).rpc('current_actor');
      const actor = result.data?.[0];
      destination =
        actor?.active && actor.application_status === 'approved'
          ? paths.roleHome(actor.role)
          : paths.authStatus;
    } catch {
      destination = paths.signIn;
    }
  }
  if (destination) redirect(destination);
  return (
    <AppShell title={roleLabels[role]}>
      <p>You are signed in.</p>
    </AppShell>
  );
}
export function RoleDestination({ role }: { role: Role }) {
  return (
    <Suspense fallback={<p role="status">Loading your account…</p>}>
      <Destination role={role} />
    </Suspense>
  );
}
