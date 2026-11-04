import Link from 'next/link';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const actions = vi.hoisted(() => ({
  saveDraft: vi.fn(),
  removeDraft: vi.fn(),
  readDraft: vi.fn(),
}));
vi.mock('@/app/faculty/courses/actions', () => actions);
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
import { DraftForm } from '@/app/faculty/courses/draft-form';
import { DeleteDraftDialog } from '@/app/faculty/courses/delete-draft-dialog';
const draft = {
  id: '00000000-0000-4000-8000-000000000001',
  revisionId: 'revision',
  ownerId: 'owner',
  version: 1,
  updatedAt: '',
  details: {
    title: '',
    description: '',
    primaryTopic: null,
    difficulty: null,
    outcomes: [],
    priorKnowledge: '',
    estimatedHours: null,
  },
} as const;
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
for (const code of ['validation', 'conflict', 'unauthenticated', 'unavailable'])
  test(`${code} preserves edits without reloading`, async () => {
    actions.saveDraft.mockResolvedValue({ ok: false, code, fields: { title: 'Check title.' } });
    render(<DraftForm draft={{ ...draft, details: { ...draft.details, outcomes: [] } }} />);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep my work' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Keep my work');
  });
test('pending save prevents duplicate activation', async () => {
  actions.saveDraft.mockReturnValue(new Promise(() => {}));
  render(<DraftForm createId={draft.id} />);
  const form = screen.getByRole('button', { name: 'Save draft' }).closest('form')!;
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Saving…' }).hasAttribute('disabled')).toBe(true)
  );
  expect(actions.saveDraft).toHaveBeenCalledTimes(1);
});
test('delete cancellation restores focus without mutation', async () => {
  render(<DeleteDraftDialog draft={{ ...draft, details: { ...draft.details, outcomes: [] } }} />);
  const trigger = screen.getByRole('button', { name: 'Delete draft' });
  fireEvent.click(trigger);
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Cancel' })).toBe(document.activeElement)
  );
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  await waitFor(() => expect(document.activeElement).toBe(trigger));
  expect(actions.removeDraft).not.toHaveBeenCalled();
});
test('transport failure reconciles without claiming saved or losing values', async () => {
  actions.saveDraft.mockRejectedValue(Error('offline'));
  actions.readDraft.mockResolvedValue({ ok: true, value: draft });
  render(<DraftForm createId={draft.id} />);
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Unsure' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() =>
    expect(screen.getByRole('alert').textContent).toContain('could not be confirmed')
  );
  expect(actions.readDraft).toHaveBeenCalledWith(draft.id);
  expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Unsure');
  expect(screen.getByRole('status').textContent).not.toContain('saved');
});
test('outcome order and optional hours reach the versioned save', async () => {
  actions.saveDraft.mockResolvedValue({ ok: true, value: { ...draft, version: 2 } });
  render(
    <DraftForm draft={{ ...draft, details: { ...draft.details, outcomes: ['One', 'Two'] } }} />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Move outcome 2 up' }));
  fireEvent.change(screen.getByLabelText('Estimated hours (optional)'), {
    target: { value: '2.5' },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Draft saved'));
  expect(actions.saveDraft).toHaveBeenCalledWith(
    draft.id,
    1,
    expect.objectContaining({ outcomes: ['Two', 'One'], estimatedHours: 2.5 })
  );
});
test('stale deletion keeps the dialog and visible record', async () => {
  actions.removeDraft.mockResolvedValue({ ok: false, code: 'conflict' });
  render(<DeleteDraftDialog draft={{ ...draft, details: { ...draft.details, outcomes: [] } }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Delete draft' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('another tab'));
  expect(screen.getByRole('dialog')).toBeTruthy();
});
test('failed save focuses its explanation and warns before link navigation discards edits', async () => {
  actions.saveDraft.mockResolvedValue({ ok: false, code: 'conflict' });
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(
    <>
      <Link href="/faculty/courses">Course drafts</Link>
      <DraftForm createId={draft.id} />
    </>
  );
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Keep this' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('alert')));
  fireEvent.click(screen.getByRole('link', { name: 'Course drafts' }));
  expect(confirm).toHaveBeenCalled();
  confirm.mockRestore();
});
test('refresh and close warn while unsaved changes remain', () => {
  render(<DraftForm createId={draft.id} />);
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Unsaved' } });
  const event = new Event('beforeunload', { cancelable: true });
  window.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
});
