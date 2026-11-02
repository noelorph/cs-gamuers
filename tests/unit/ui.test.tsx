import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

afterEach(cleanup);

test('shared button retains native disabled behavior and link composition', () => {
  const action = vi.fn();
  render(
    <>
      <Button disabled onClick={action}>
        Submit
      </Button>
      <Button asChild>
        <a href="/lesson">Back to lesson</a>
      </Button>
    </>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
  expect(action).not.toHaveBeenCalled();
  expect(screen.getByRole('link').getAttribute('href')).toBe('/lesson');
});

test('dialog has an accessible name and restores focus on Escape', async () => {
  render(
    <Dialog>
      <DialogTrigger asChild>
        <Button>Review</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Review course</DialogTitle>
        <DialogDescription>Choose your review action.</DialogDescription>
      </DialogContent>
    </Dialog>
  );
  const trigger = screen.getByRole('button', { name: 'Review' });
  trigger.focus();
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog', { name: 'Review course' })).toBeDefined();
  fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  await waitFor(() => expect(document.activeElement).toBe(trigger));
});
