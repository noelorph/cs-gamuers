import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { VerifyEmailForm } from '@/components/verify-email-form';
afterEach(cleanup);
it('generic resend acknowledgment preserves entered email, prevents repeats and makes no delivery claim', async () => {
  render(<VerifyEmailForm resend={async () => ({ ok: true, code: 'acknowledged' })} />);
  fireEvent.change(screen.getByLabelText('Email (required)'), {
    target: { value: 'synthetic@example.invalid' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Request a new link' }));
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toContain('If this address can be verified')
  );
  expect(screen.getByRole('button')).toHaveProperty('disabled', true);
  expect(screen.getByLabelText('Email (required)')).toHaveProperty(
    'value',
    'synthetic@example.invalid'
  );
  expect(screen.queryByText(/delivered|email sent/i)).toBeNull();
});
it.each(['throttled', 'unavailable'] as const)(
  'resend %s is focused, persistent and retains email',
  async (code) => {
    render(
      <VerifyEmailForm
        initialEmail="synthetic@example.invalid"
        resend={async () => ({ ok: false, code })}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    const error = await screen.findByRole('alert');
    await waitFor(() => expect(document.activeElement).toBe(error));
    expect(error.textContent).toContain(code === 'throttled' ? 'Wait' : 'Try again');
    expect(screen.getByLabelText('Email (required)')).toHaveProperty(
      'value',
      'synthetic@example.invalid'
    );
  }
);
