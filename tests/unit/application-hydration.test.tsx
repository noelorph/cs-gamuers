import { act, cleanup, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot, type Root } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import type { Application } from '@/features/accounts/application-types';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/app/auth/status/actions', () => ({
  readApplication: vi.fn(),
  saveCorrection: vi.fn(),
  resubmitCorrection: vi.fn(),
  verifyReplacement: vi.fn(),
  cancelReplacement: vi.fn(),
}));
vi.mock('@/app/admin/applications/actions', () => ({
  submitReview: vi.fn(),
  readReview: vi.fn(),
  releaseStudentNumber: vi.fn(),
}));
import { ApplicationStatus } from '@/app/auth/status/status';
import { ApplicationReview } from '@/components/application-review';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const application: Application = {
  id: 'hydration-fixture',
  full_name: 'Synthetic applicant',
  role: 'student',
  status: 'needs_correction',
  applied_at: '2026-11-07T06:00:00.000Z',
  email: 'synthetic@caloocan.sti.edu.ph',
  student_number: '00123',
  employee_number: null,
  version: 2,
  email_verified: true,
  history: [
    {
      id: 'decision',
      event: 'application_needs_correction',
      reason: 'Synthetic correction reason.',
      created_at: '2026-11-07T06:00:00.000Z',
    },
  ],
};
it.each(['applicant', 'reviewer'])(
  '%s decision time hydrates consistently across different server/browser locale and timezone defaults',
  async (view) => {
    const nativeFormat = Date.prototype.toLocaleString;
    let defaults = { locale: 'en-US', timeZone: 'UTC' };
    vi.spyOn(Date.prototype, 'toLocaleString').mockImplementation(function (
      this: Date,
      locales,
      options
    ) {
      return nativeFormat.call(this, locales ?? defaults.locale, {
        timeZone: defaults.timeZone,
        ...options,
      });
    });
    const content =
      view === 'applicant' ? (
        <ApplicationStatus initial={{ ok: true, value: application }} />
      ) : (
        <ApplicationReview initial={application} administrator queueHref="/admin/applications" />
      );
    const container = document.createElement('div');
    document.body.append(container);
    container.innerHTML = renderToString(content);
    const serverLabel = container.querySelector('time')!.textContent;
    defaults = { locale: 'en-GB', timeZone: 'Pacific/Honolulu' };
    const recoverable: unknown[] = [];
    let root: Root | undefined;
    try {
      await act(async () => {
        root = hydrateRoot(container, content, {
          onRecoverableError: (error) => recoverable.push(error),
        });
      });
      expect(recoverable).toEqual([]);
      const time = container.querySelector('time')!;
      expect(time.getAttribute('datetime')).toBe(application.history[0].created_at);
      expect(time.textContent).toBe(serverLabel);
      expect(time.textContent).toContain('2:00:00 PM');
      expect(time.textContent).toContain('GMT+8');
    } finally {
      if (root) await act(async () => root!.unmount());
      container.remove();
    }
  }
);

it('withholds decisions for an unverified Pending application opened directly', () => {
  render(
    <ApplicationReview
      initial={{ ...application, status: 'pending', email_verified: false }}
      administrator
      queueHref="/admin/applications"
    />
  );
  expect(screen.queryByRole('button', { name: 'Review decision' })).toBeNull();
  expect(screen.getByText(/Verify the current email before reviewing/)).toBeTruthy();
});
