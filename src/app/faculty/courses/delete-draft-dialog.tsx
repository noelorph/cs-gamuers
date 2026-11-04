'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import type { CourseDraft } from '@/features/content/types';
import { paths } from '@/config/paths';
import { removeDraft, readDraft } from './actions';
import { draftError } from './draft-feedback';
import { clearDraftRecovery } from './draft-recovery';
export function DeleteDraftDialog({ draft }: { draft: CourseDraft }) {
  const router = useRouter();
  const cancel = useRef<HTMLButtonElement>(null);
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function remove() {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setError('');
    try {
      const result = await removeDraft(draft.id, draft.version);
      if (result.ok) {
        clearDraftRecovery(draft.ownerId, draft.id);
        router.replace(paths.courses);
        router.refresh();
      } else setError(draftError(result));
    } catch {
      try {
        await readDraft(draft.id);
      } catch {
        /* No confirmed deletion. */
      }
      setError(
        'Deletion could not be confirmed. This page remains here. Check the saved draft before trying again.'
      );
    } finally {
      lock.current = false;
      setPending(false);
    }
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete draft</Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancel.current?.focus();
        }}
        onPointerDownOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <DialogTitle className="break-words">
          Delete “{draft.details.title || 'Untitled draft'}”?
        </DialogTitle>
        <DialogDescription>
          This permanently deletes this unpublished draft and its saved details. Unsaved edits will
          also be discarded.
        </DialogDescription>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-4">
          <DialogClose asChild>
            <Button ref={cancel} variant="outline" disabled={pending}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={remove}>
            {pending ? 'Deleting…' : 'Confirm deletion'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
