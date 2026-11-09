import Link from 'next/link';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
const actions = vi.hoisted(() => ({
  saveDraft: vi.fn(),
  removeDraft: vi.fn(),
  readDraft: vi.fn(),
}));
vi.mock('@/app/faculty/courses/actions', () => actions);
vi.mock('next/navigation', () => ({ useRouter: () => router }));
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
  actions.saveDraft.mockResolvedValue({
    ok: true,
    value: {
      ...draft,
      version: 2,
      details: { ...draft.details, outcomes: ['Two', 'One'], estimatedHours: 2.5 },
    },
  });
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
test('untouched blank create uncertainty survives remount with its original UUID', async () => {
  actions.saveDraft.mockResolvedValue({ ok: false, code: 'unavailable' });
  const first = render(<DraftForm createId={draft.id} ownerId="blank-owner" />);
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
  first.unmount();
  render(<DraftForm createId="00000000-0000-4000-8000-000000000099" ownerId="blank-owner" />);
  expect(screen.getByRole('alert').textContent).toContain('could not be confirmed');
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() =>
    expect(actions.saveDraft).toHaveBeenLastCalledWith(
      draft.id,
      null,
      expect.objectContaining({ title: '' })
    )
  );
});
for (const changedTitle of ['Changed after uncertainty', ''])
  test(`returned existing create preserves differing entered details (${changedTitle || 'blank'})`, async () => {
    const persisted = {
      ...draft,
      version: 4,
      details: { ...draft.details, title: 'Original saved title', outcomes: ['Stored outcome'] },
    };
    actions.saveDraft
      .mockRejectedValueOnce(Error('lost response'))
      .mockResolvedValueOnce({ ok: true, value: persisted });
    actions.readDraft.mockResolvedValue({ ok: true, value: persisted });
    render(<DraftForm createId={draft.id} ownerId="retry-owner" />);
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Original saved title' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: changedTitle } });
    fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toContain('different details')
    );
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(changedTitle);
    expect(screen.getByRole('status').textContent).not.toBe('Draft saved');
    expect(router.replace).not.toHaveBeenCalled();
    expect(draftRecovery.get('retry-owner/new')).toEqual(
      expect.objectContaining({
        id: draft.id,
        version: 4,
        details: expect.objectContaining({ title: changedTitle, outcomes: [] }),
      })
    );
    expect(actions.saveDraft).toHaveBeenCalledTimes(2);
    actions.saveDraft.mockResolvedValueOnce({ ok: false, code: 'conflict' });
    fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('another tab'));
    expect(actions.saveDraft).toHaveBeenLastCalledWith(
      draft.id,
      4,
      expect.objectContaining({ title: changedTitle })
    );
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(changedTitle);
  });
test('direct untouched create mismatch needs an explicit versioned save before confirmation', async () => {
  const existing = {
    ...draft,
    version: 7,
    details: { ...draft.details, description: 'Already persisted', outcomes: [] },
  };
  actions.saveDraft.mockResolvedValueOnce({ ok: true, value: existing });
  render(<DraftForm createId={draft.id} ownerId="direct-owner" />);
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('different details'));
  expect((screen.getByLabelText('Description') as HTMLTextAreaElement).value).toBe('');
  expect(router.replace).not.toHaveBeenCalled();
  expect(draftRecovery.get('direct-owner/new')?.version).toBe(7);
  actions.saveDraft.mockResolvedValueOnce({
    ok: true,
    value: { ...existing, version: 8, details: { ...draft.details, outcomes: [] } },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Draft saved'));
  expect(actions.saveDraft).toHaveBeenLastCalledWith(
    draft.id,
    7,
    expect.objectContaining({ description: '' })
  );
  expect(draftRecovery.size).toBe(0);
  expect(router.replace).toHaveBeenCalledTimes(1);
});
test('matching persisted details ignore JSON property order', async () => {
  actions.saveDraft.mockResolvedValue({
    ok: true,
    value: {
      ...draft,
      details: {
        outcomes: [],
        estimatedHours: null,
        difficulty: null,
        title: '',
        priorKnowledge: '',
        primaryTopic: null,
        description: '',
      },
    },
  });
  render(<DraftForm createId={draft.id} ownerId="order-owner" />);
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('status').textContent).toBe('Draft saved'));
  expect(draftRecovery.size).toBe(0);
});
test('blank pending create retains its UUID and an obsolete response cannot discard newer recovered work', async () => {
  let resolve!: (value: unknown) => void;
  actions.saveDraft.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    })
  );
  const first = render(
    <StrictMode>
      <DraftForm createId={draft.id} ownerId="pending-owner" />
    </StrictMode>
  );
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() => expect(draftRecovery.get('pending-owner/new')?.id).toBe(draft.id));
  first.unmount();
  render(<DraftForm createId="00000000-0000-4000-8000-000000000099" ownerId="pending-owner" />);
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New recovered work' } });
  await act(async () => {
    resolve({ ok: true, value: { ...draft, details: { ...draft.details, outcomes: [] } } });
  });
  await waitFor(() =>
    expect(draftRecovery.get('pending-owner/new')?.details.title).toBe('New recovered work')
  );
  expect(router.replace).not.toHaveBeenCalled();
});
test('an obsolete delete completion cannot navigate away from a newer editor', async () => {
  let resolve!: (value: unknown) => void;
  actions.removeDraft.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    })
  );
  const first = render(
    <DeleteDraftDialog draft={{ ...draft, details: { ...draft.details, outcomes: [] } }} />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Delete draft' }));
  fireEvent.click(screen.getByRole('button', { name: 'Confirm deletion' }));
  first.unmount();
  render(<DraftForm createId="00000000-0000-4000-8000-000000000098" ownerId="owner" />);
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Other new draft' } });
  await act(async () => {
    resolve({ ok: true, value: null });
  });
  expect(router.replace).not.toHaveBeenCalled();
  expect(draftRecovery.get('owner/new')?.details.title).toBe('Other new draft');
});
test('a returned outcome permutation is not reported as the entered order saved', async () => {
  actions.saveDraft.mockResolvedValue({
    ok: true,
    value: { ...draft, details: { ...draft.details, outcomes: ['Two', 'One'] } },
  });
  render(<DraftForm createId={draft.id} ownerId="outcome-owner" />);
  fireEvent.click(screen.getByRole('button', { name: 'Add outcome' }));
  fireEvent.change(screen.getByLabelText('Outcome 1'), { target: { value: 'One' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add outcome' }));
  fireEvent.change(screen.getByLabelText('Outcome 2'), { target: { value: 'Two' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Save draft' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('different details'));
  expect((screen.getByLabelText('Outcome 1') as HTMLTextAreaElement).value).toBe('One');
  expect(router.replace).not.toHaveBeenCalled();
});
