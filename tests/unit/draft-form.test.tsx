import Link from 'next/link';
import { renderToString } from 'react-dom/server';
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
import { draftRecovery } from '@/app/faculty/courses/draft-recovery';
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
  draftRecovery.clear();
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
  expect(fireEvent.click(screen.getByRole('link', { name: 'Course drafts' }))).toBe(false);
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
test('remount recovers rejected edits and the original expected version', async () => {
  const original = {
    ...draft,
    id: '00000000-0000-4000-8000-000000000002',
    details: { ...draft.details, outcomes: [] },
  };
  actions.saveDraft.mockResolvedValue({ ok: false, code: 'conflict' });
  const first = render(<DraftForm draft={original} />);
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'Recover my rejected edits' },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  first.unmount();
  render(<DraftForm draft={{ ...original, version: 9 }} />);
  await waitFor(() =>
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'Recover my rejected edits'
    )
  );
  expect(screen.getByRole('alert').textContent).toContain('another tab');
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() =>
    expect(actions.saveDraft).toHaveBeenLastCalledWith(
      original.id,
      1,
      expect.objectContaining({ title: 'Recover my rejected edits' })
    )
  );
});
test('new editor recovery retains its original create UUID and isolates owners', async () => {
  const first = render(
    <DraftForm createId="00000000-0000-4000-8000-000000000003" {...{ ownerId: 'new-owner' }} />
  );
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Uncreated work' } });
  first.unmount();
  const other = render(
    <DraftForm createId="00000000-0000-4000-8000-000000000004" {...{ ownerId: 'another-owner' }} />
  );
  expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('');
  other.unmount();
  render(
    <DraftForm createId="00000000-0000-4000-8000-000000000005" {...{ ownerId: 'new-owner' }} />
  );
  await waitFor(() =>
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Uncreated work')
  );
  actions.saveDraft.mockResolvedValue({ ok: false, code: 'unavailable' });
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() =>
    expect(actions.saveDraft).toHaveBeenLastCalledWith(
      '00000000-0000-4000-8000-000000000003',
      null,
      expect.objectContaining({ title: 'Uncreated work' })
    )
  );
});
test('confirmed creation clears every recovery alias for its stable UUID', async () => {
  const id = '00000000-0000-4000-8000-000000000006';
  const first = render(<DraftForm createId={id} ownerId="create-owner" />);
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Confirmed' } });
  const snapshot = draftRecovery.get('create-owner/new')!;
  draftRecovery.set(`create-owner/${id}`, snapshot);
  actions.saveDraft.mockResolvedValue({
    ok: true,
    value: {
      ...draft,
      id,
      ownerId: 'create-owner',
      details: { ...draft.details, title: 'Confirmed', outcomes: [] },
    },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Draft saved'));
  first.unmount();
  expect(draftRecovery.size).toBe(0);
  render(<DraftForm createId={id} ownerId="create-owner" />);
  expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('');
});
test('explicit confirmed navigation discards recoverable edits', () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(
    <>
      <Link href="#">Stay</Link>
      <Link href="/faculty/courses" onClick={(event) => event.preventDefault()}>
        Leave
      </Link>
      <DraftForm createId={draft.id} ownerId="discard-owner" />
    </>
  );
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Discard this' } });
  expect(draftRecovery.size).toBe(1);
  fireEvent.click(screen.getByRole('link', { name: 'Leave' }));
  expect(draftRecovery.size).toBe(0);
  confirm.mockRestore();
});
test('SSR never renders browser recovery or changes the recovery store', () => {
  const snapshot = {
    id: draft.id,
    version: 1,
    details: { ...draft.details, title: 'Private unsaved text', outcomes: [] },
    hours: '',
    error: '',
    fields: {},
  };
  draftRecovery.set(`owner/${draft.id}`, snapshot);
  const html = renderToString(
    <DraftForm draft={{ ...draft, details: { ...draft.details, outcomes: [] } }} />
  );
  expect(html).not.toContain('Private unsaved text');
  expect(draftRecovery.get(`owner/${draft.id}`)).toBe(snapshot);
});
test('only confirmed deletion clears recoverable edits', async () => {
  const snapshot = {
    id: draft.id,
    version: 1,
    details: { ...draft.details, outcomes: [] },
    hours: '',
    error: '',
    fields: {},
  };
  draftRecovery.set(`owner/${draft.id}`, snapshot);
  actions.removeDraft
    .mockResolvedValueOnce({ ok: false, code: 'conflict' })
    .mockResolvedValueOnce({ ok: true, value: null });
  render(<DeleteDraftDialog draft={{ ...draft, details: { ...draft.details, outcomes: [] } }} />);
  fireEvent.click(screen.getByRole('button', { name: 'Delete draft' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));
  await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  expect(draftRecovery.get(`owner/${draft.id}`)).toBe(snapshot);
  fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));
  await waitFor(() => expect(draftRecovery.size).toBe(0));
});
test('pre-ready rendering exposes no controls that hydration can discard', async () => {
  const props = { draft: { ...draft, details: { ...draft.details, outcomes: [] } } };
  const html = renderToString(<DraftForm {...props} />);
  expect(html).not.toContain('<input');
  expect(html).toContain('Loading draft editor');
  render(<DraftForm {...props} />);
  fireEvent.change(screen.getByLabelText('Title'), {
    target: { value: 'First editable input survives' },
  });
  await waitFor(() =>
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'First editable input survives'
    )
  );
});
