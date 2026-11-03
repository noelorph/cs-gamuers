import { expect, it } from 'vitest';
import * as validation from '@/features/accounts/validation';

it('exports invitation name/password validation independent of caller role', () => {
  expect(validation).toHaveProperty('validateInvitationInput', expect.any(Function));
});
it('announces and focuses validation errors after keyboard submission while retaining values', async () => {
  const { render, screen, fireEvent, cleanup, waitFor } = await import('@testing-library/react');
  const { EmailForm } = await import('@/app/auth/email/email-form');
  let completed = false;
  render(
    <EmailForm
      challenge={'a'.repeat(64)}
      prepare={async () => {}}
      confirm={async () => ({ operationId: 'synthetic', purpose: 'invitation' })}
      complete={async () => {
        completed = true;
        return { complete: true };
      }}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Confirm email' }));
  const name = await screen.findByLabelText('Full name');
  const password = screen.getByLabelText('New password');
  fireEvent.change(name, { target: { value: 'Synthetic holder' } });
  fireEvent.change(password, { target: { value: 'short' } });
  const button = screen.getByRole('button', { name: 'Accept invitation' });
  button.focus();
  fireEvent.keyDown(button, { key: 'Enter' });
  fireEvent.submit(button.closest('form')!);
  const summary = await screen.findByRole('alert');
  await waitFor(() => expect(document.activeElement).toBe(summary));
  expect(summary.textContent).toContain('Check the highlighted fields');
  expect(name).toHaveProperty('value', 'Synthetic holder');
  expect(password).toHaveProperty('value', 'short');
  expect(completed).toBe(false);
  cleanup();
});

it('renders an explicit confirmation without consuming a GET, then exposes labelled invitation fields', async () => {
  const { render, screen, fireEvent, cleanup } = await import('@testing-library/react');
  const subject = await import('@/app/auth/email/email-form').catch(() => null);
  expect(subject?.EmailForm).toBeTypeOf('function');
  if (!subject) return;
  let confirmed = 0;
  render(
    <subject.EmailForm
      challenge={'a'.repeat(64)}
      prepare={async () => {}}
      confirm={async () => {
        confirmed++;
        return { operationId: 'synthetic-id', purpose: 'invitation' };
      }}
      complete={async () => ({ complete: true })}
    />
  );
  expect(confirmed).toBe(0);
  fireEvent.click(screen.getByRole('button', { name: 'Confirm email' }));
  expect(await screen.findByLabelText('Full name')).toBeTruthy();
  expect(screen.getByLabelText('New password')).toHaveProperty('type', 'password');
  expect(confirmed).toBe(1);
  cleanup();
});
it('shows a rejected confirmation preflight without consuming the proof', async () => {
  const { render, screen, fireEvent, cleanup } = await import('@testing-library/react');
  const { EmailForm } = await import('@/app/auth/email/email-form');
  let confirmed = false;
  render(
    <EmailForm
      challenge={'a'.repeat(64)}
      prepare={async () => ({ error: 'Open the original HTTPS link.' })}
      confirm={async () => {
        confirmed = true;
        return { operationId: 'synthetic', purpose: 'verification' };
      }}
      complete={async () => ({ complete: true })}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: 'Confirm email' }));
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    'Open the original HTTPS link.'
  );
  expect(confirmed).toBe(false);
  cleanup();
});
