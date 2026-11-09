import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { requireActor } from '@/lib/access';
import { createRequestClient } from '@/lib/supabase/server';
import { paths } from '@/config/paths';
import type { Role } from '@/features/accounts/types';
import { Button } from './ui/button';
import { AppNav, type NavItem } from './app-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from './ui/sidebar';
export const roleLabels: Record<Role, string> = {
  student: 'Student',
  faculty: 'Faculty',
  program_head: 'Program Head',
  administrator: 'Administrator',
};
export const facultyNav: NavItem[] = [
  { label: 'Home', href: paths.roleHome('faculty') },
  { label: 'Course drafts', href: paths.courses },
  { label: 'Student applications', href: paths.applications('faculty') },
];
export const adminNav: NavItem[] = [
  { label: 'Home', href: paths.roleHome('administrator') },
  { label: 'Applications', href: paths.applications('administrator') },
];
const navByRole: Partial<Record<Role, NavItem[]>> = {
  faculty: facultyNav,
  administrator: adminNav,
};
export function AppShell({
  title,
  nav = [],
  signOutPortal = 'standard',
  children,
}: {
  title: string;
  nav?: NavItem[];
  signOutPortal?: 'standard' | 'admin';
  children: ReactNode;
}) {
  return (
    <SidebarProvider className="bg-muted">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Sidebar aria-label="Primary">
        <SidebarHeader className="px-4 py-4">
          <span className="text-lg font-semibold text-primary">CS-GAMUERS</span>
        </SidebarHeader>
        <SidebarContent>
          <AppNav items={nav} />
        </SidebarContent>
        <SidebarFooter className="p-4">
          <form
            action={paths.signOut + (signOutPortal === 'admin' ? '?portal=admin' : '')}
            method="post"
          >
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-w-0 bg-muted">
        <div className="flex items-center gap-2 px-4 pt-4 md:px-6">
          <SidebarTrigger />
        </div>
        <main id="main" className="box-border min-w-0 max-w-[1200px] px-4 py-6 md:px-6">
          <h1 className="m-0 break-words text-2xl font-semibold">{title}</h1>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
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
      if (result.error || !actor) throw new Error('Authentication required');
      destination =
        actor?.active && actor.application_status === 'approved'
          ? paths.roleHome(actor.role)
          : paths.authStatus;
    } catch {
      const ended = (await cookies()).getAll().some(({ name }) => name.includes('-auth-token'));
      destination = paths.login(role) + (ended ? '?session=ended' : '');
    }
  }
  if (destination) redirect(destination);
  return (
    <AppShell
      title={roleLabels[role]}
      nav={navByRole[role]}
      signOutPortal={role === 'administrator' ? 'admin' : 'standard'}
    >
      <p>You are signed in.</p>
      {role === 'faculty' && <Link href={paths.courses}>Course drafts</Link>}
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
