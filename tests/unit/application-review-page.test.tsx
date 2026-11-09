import { afterEach, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
const mocks = vi.hoisted(() => ({ actor: vi.fn(), rpc: vi.fn() }));
vi.mock('@/lib/access', () => ({ requireActor: mocks.actor }));
vi.mock('@/lib/supabase/server', () => ({ createRequestClient: async () => ({ rpc: mocks.rpc }) }));
vi.mock('@/features/accounts/applications', () => ({
  getApplication: vi.fn(),
  listApplications: vi.fn(),
}));
vi.mock('@/components/application-review', () => ({ ApplicationReview: () => null }));
vi.mock('@/components/app-shell', () => ({ AppShell: () => null, adminNav: [], facultyNav: [] }));
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw Error(path);
  },
}));
import { ApplicationReviewPage } from '@/components/application-review-page';
afterEach(() => vi.clearAllMocks());
it.each([
  ['administrator', 'student', 'approved', '/student'],
  ['faculty', 'administrator', 'approved', '/admin'],
  ['administrator', 'faculty', 'pending', '/auth/status'],
  ['faculty', 'student', 'pending', '/auth/status'],
  ['administrator', null, null, '/admin/sign-in'],
  ['faculty', null, null, '/auth/sign-in'],
] as const)(
  'routes denied %s review access for %s/%s to %s',
  async (role, actorRole, status, destination) => {
    mocks.actor.mockRejectedValue(Error('Access denied'));
    mocks.rpc.mockResolvedValue({
      data: actorRole ? [{ role: actorRole, active: true, application_status: status }] : [],
      error: null,
    });
    const page = ApplicationReviewPage({ role, searchParams: Promise.resolve({}) });
    const child = page.props.children as ReactElement;
    const render = child.type as (props: unknown) => Promise<unknown>;
    await expect(render(child.props)).rejects.toThrow(destination);
  }
);
