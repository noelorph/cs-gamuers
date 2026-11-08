import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { Application } from '@/features/accounts/application-types';
vi.mock('@/app/auth/status/actions', () => ({
  readApplication: vi.fn(),
  saveCorrection: vi.fn(),
  resubmitCorrection: vi.fn(),
  verifyReplacement: vi.fn(),
  cancelReplacement: vi.fn(),
}));
import {
  cancelReplacement,
  readApplication,
  saveCorrection,
  verifyReplacement,
} from '@/app/auth/status/actions';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
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

const saved: Application = {
  id: 'draft-fixture',
  full_name: 'Saved applicant',
  role: 'student',
  status: 'pending',
  applied_at: '2026-11-01T00:00:00Z',
  email: 'fixture@caloocan.sti.edu.ph',
  student_number: '00123',
  employee_number: null,
  version: 1,
  email_verified: true,
  history: [],
};
const replacement = {
  email: 'replacement@caloocan.sti.edu.ph',
  expires_at: '2026-11-01T00:30:00Z',
};
function editDraft() {
  fireEvent.click(screen.getByRole('button', { name: 'Edit application' }));
  fireEvent.change(screen.getByLabelText('Full name (required)'), {
    target: { value: 'Unsaved applicant name' },
  });
  fireEvent.change(screen.getByLabelText('Student number (required)'), {
    target: { value: '00999' },
  });
}
function expectDraft() {
  expect((screen.getByLabelText('Full name (required)') as HTMLInputElement).value).toBe(
    'Unsaved applicant name'
  );
  expect((screen.getByLabelText('Student number (required)') as HTMLInputElement).value).toBe(
    '00999'
  );
}
it('preserves an open identity draft through replacement request and cancellation, then saves with the returned version', async () => {
  vi.mocked(verifyReplacement).mockResolvedValue({
    ok: true,
    value: { ...saved, version: 2, replacement },
  });
  vi.mocked(cancelReplacement).mockResolvedValue({
    ok: true,
    value: { ...saved, version: 3, replacement: null },
  });
  vi.mocked(saveCorrection).mockResolvedValue({
    ok: true,
    value: { ...saved, version: 4, full_name: 'Unsaved applicant name', student_number: '00999' },
  });
  render(<ApplicationStatus initial={{ ok: true, value: saved }} />);
  editDraft();
  fireEvent.change(screen.getByLabelText('Replacement email (required)'), {
    target: { value: replacement.email },
  });
  fireEvent.submit(
    screen.getByRole('button', { name: 'Verify replacement email' }).closest('form')!
  );
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toContain('verification queued')
  );
  expectDraft();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel replacement email' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('cancelled'));
  expect(cancelReplacement).toHaveBeenCalledWith(2);
  expectDraft();
  fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Changes saved.'));
  expect(saveCorrection).toHaveBeenCalledWith(3, {
    fullName: 'Unsaved applicant name',
    studentNumber: '00999',
    employeeNumber: null,
  });
  expect(screen.queryByLabelText('Full name (required)')).toBeNull();
});
it('preserves an open identity draft when cancelling an already pending replacement', async () => {
  vi.mocked(cancelReplacement).mockResolvedValue({
    ok: true,
    value: { ...saved, version: 3, replacement: null },
  });
  render(
    <ApplicationStatus initial={{ ok: true, value: { ...saved, version: 2, replacement } }} />
  );
  editDraft();
  fireEvent.click(screen.getByRole('button', { name: 'Cancel replacement email' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('cancelled'));
  expectDraft();
});
it('discards an identity draft only after a confirmed successful reload', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  vi.mocked(readApplication).mockResolvedValue({ ok: true, value: { ...saved, version: 2 } });
  render(<ApplicationStatus initial={{ ok: true, value: saved }} />);
  editDraft();
  fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }));
  expect(readApplication).not.toHaveBeenCalled();
  expectDraft();
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Refresh status' }));
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Status refreshed.'));
  expect(screen.queryByLabelText('Full name (required)')).toBeNull();
});

it.each(['student', 'faculty'] as const)(
  'locks %s identity inputs while the submitted save is pending',
  async (role) => {
    let finish!: (value: Awaited<ReturnType<typeof saveCorrection>>) => void;
    vi.mocked(saveCorrection).mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        })
    );
    render(<ApplicationStatus initial={{ ok: true, value: { ...saved, role } }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit application' }));
    const name = screen.getByLabelText('Full name (required)') as HTMLInputElement;
    const number = screen.getByLabelText(
      role === 'student' ? 'Student number (required)' : 'Employee number (optional)'
    ) as HTMLInputElement;
    fireEvent.change(name, { target: { value: 'Submitted name' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Save changes' }).closest('form')!);
    expect(name.disabled).toBe(true);
    expect(number.disabled).toBe(true);
    await act(async () =>
      finish({ ok: true, value: { ...saved, role, full_name: 'Submitted name', version: 2 } })
    );
    expect(screen.getByRole('status').textContent).toBe('Changes saved.');
    fireEvent.click(screen.getByRole('button', { name: 'Edit application' }));
    expect((screen.getByLabelText('Full name (required)') as HTMLInputElement).value).toBe(
      'Submitted name'
    );
  }
);
