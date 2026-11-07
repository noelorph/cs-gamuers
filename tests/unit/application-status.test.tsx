import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { Application } from '@/features/accounts/application-types';
vi.mock('@/app/auth/status/actions', () => ({
  readApplication: vi.fn(),
  saveCorrection: vi.fn(),
  resubmitCorrection: vi.fn(),
  verifyReplacement: vi.fn(),
  cancelReplacement: vi.fn(),
}));
import { ApplicationStatus } from '@/app/auth/status/status';
it('keeps the requested correction visible after a replacement email was verified', () => {
  const application: Application = {
    id: 'fixture',
    full_name: 'Synthetic applicant',
    role: 'student',
    status: 'needs_correction',
    applied_at: '2026-11-01T00:00:00Z',
    email: 'fixture@caloocan.sti.edu.ph',
    student_number: '00123',
    employee_number: null,
    version: 4,
    email_verified: true,
    history: [
      {
        id: 'new',
        event: 'application_email_changed',
        reason: 'Applicant verified a replacement email.',
        created_at: '2026-11-02T00:00:00Z',
      },
      {
        id: 'decision',
        event: 'application_needs_correction',
        reason: 'Include the complete enrollment name.',
        created_at: '2026-11-01T00:00:00Z',
      },
    ],
  };
  render(<ApplicationStatus initial={{ ok: true, value: application }} />);
  expect(screen.getByText('Include the complete enrollment name.')).toBeTruthy();
});
