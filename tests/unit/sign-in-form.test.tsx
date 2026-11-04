import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const submit = vi.hoisted(() => vi.fn());
vi.mock('@/app/auth/sign-in/actions', () => ({ submitSignIn: submit }));
import { SignInForm } from '@/app/auth/sign-in/sign-in-form';
afterEach(cleanup);
test('transport failures show a focused form error and retain the email', async () => {
  submit.mockRejectedValue(Error('unavailable transport'));
  render(<SignInForm />);
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'synthetic@example.invalid' },
  });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'synthetic password' } });
  fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('unavailable'));
  expect(document.activeElement).toBe(screen.getByRole('alert'));
  expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe(
    'synthetic@example.invalid'
  );
});
