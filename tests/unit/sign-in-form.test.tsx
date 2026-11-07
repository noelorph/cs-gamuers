import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
const submit = vi.hoisted(() => vi.fn());
vi.mock('@/app/auth/sign-in/actions', () => ({ submitSignIn: submit }));
import { SignInForm } from '@/components/sign-in-form';
afterEach(cleanup);
test('transport failures show a focused form error and retain the email', async () => {
  submit.mockRejectedValue(Error('unavailable transport'));
  render(<SignInForm submit={submit} />);
  fireEvent.change(screen.getByLabelText('Email (required)'), {
    target: { value: 'synthetic@example.invalid' },
  });
  fireEvent.change(screen.getByLabelText('Password (required)'), {
    target: { value: 'synthetic password' },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);
  await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('unavailable'));
  expect(document.activeElement).toBe(screen.getByRole('alert'));
  expect((screen.getByLabelText('Email (required)') as HTMLInputElement).value).toBe(
    'synthetic@example.invalid'
  );
});

test('wrong portal offers only the server-selected login and clears the password', async () => {
  submit.mockResolvedValue({
    message: 'Use Administrator sign in for this account.',
    destination: '/admin/sign-in',
  });
  render(<SignInForm submit={submit} />);
  fireEvent.change(screen.getByLabelText('Email (required)'), {
    target: { value: 'synthetic@example.invalid' },
  });
  fireEvent.change(screen.getByLabelText('Password (required)'), {
    target: { value: 'synthetic password' },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Sign in' }).closest('form')!);
  await waitFor(() =>
    expect(screen.getByRole('link', { name: 'Administrator sign in' }).getAttribute('href')).toBe(
      '/admin/sign-in'
    )
  );
  expect((screen.getByLabelText('Password (required)') as HTMLInputElement).value).toBe('');
});
test('password visibility can be toggled without submitting', () => {
  render(<SignInForm submit={submit} />);
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  expect(screen.getByLabelText('Password (required)').getAttribute('type')).toBe('text');
  expect(screen.getByRole('button', { name: 'Hide password' }).getAttribute('aria-pressed')).toBe(
    'true'
  );
});

test('invalid required fields expose specific inline feedback', () => {
  render(<SignInForm submit={submit} />);
  fireEvent.invalid(screen.getByLabelText('Email (required)'));
  fireEvent.invalid(screen.getByLabelText('Password (required)'));
  expect(screen.getByText('Enter your email address.')).toBeTruthy();
  expect(screen.getByText('Enter your password.')).toBeTruthy();
  expect(screen.getByLabelText('Email (required)').getAttribute('aria-invalid')).toBe('true');
});
