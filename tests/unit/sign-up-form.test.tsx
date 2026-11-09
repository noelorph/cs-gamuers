import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SignUpForm } from '@/components/sign-up-form';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const unavailable = async () => ({ ok: false as const, code: 'unavailable' as const });
const resend = async () => ({ ok: true as const, code: 'acknowledged' as const });
function fill(role = 'student') {
  fireEvent.change(screen.getByLabelText('Full name (required)'), {
    target: { value: 'Synthetic applicant' },
  });
  if (role === 'student')
    fireEvent.change(screen.getByLabelText('Student number (required)'), {
      target: { value: '00123-A' },
    });
  fireEvent.change(
    screen.getByLabelText(role === 'student' ? 'School email (required)' : 'Email (required)'),
    {
      target: {
        value: role === 'student' ? 'synthetic@caloocan.sti.edu.ph' : 'synthetic@example.invalid',
      },
    }
  );
  fireEvent.change(screen.getByLabelText('Password (required)'), {
    target: { value: 'Synthetic passphrase 9' },
  });
}
it('Student application uses textual identifiers and password-manager semantics without age or privileged roles', () => {
  render(<SignUpForm role="student" submit={unavailable} resend={resend} />);
  expect(screen.getByLabelText('Student number (required)')).toHaveProperty('type', 'text');
  expect(screen.getByLabelText('Full name (required)').getAttribute('autocomplete')).toBe('name');
  expect(screen.getByLabelText('School email (required)').getAttribute('autocomplete')).toBe(
    'email'
  );
  expect(screen.getByLabelText('Password (required)').getAttribute('autocomplete')).toBe(
    'new-password'
  );
  expect(screen.queryByLabelText(/age|employee|role/i)).toBeNull();
});
it('Faculty accepts a personal address and omitted optional employee number', async () => {
  render(<SignUpForm role="faculty" submit={unavailable} resend={resend} />);
  expect(screen.getByLabelText('Employee number (optional)')).toHaveProperty('type', 'text');
  expect(screen.queryByLabelText(/student number/i)).toBeNull();
  fill('faculty');
  fireEvent.submit(screen.getByRole('button', { name: 'Submit application' }).closest('form')!);
  expect(await screen.findByRole('alert')).toHaveProperty(
    'textContent',
    expect.stringContaining('unavailable')
  );
});
it('invalid signup focuses linked summary, retains text and clears password without submitting', async () => {
  let submitted = false;
  render(
    <SignUpForm
      role="student"
      submit={async () => {
        submitted = true;
        return unavailable();
      }}
      resend={resend}
    />
  );
  fill();
  fireEvent.change(screen.getByLabelText('School email (required)'), {
    target: { value: 'synthetic@wrong.invalid' },
  });
  fireEvent.submit(screen.getByRole('button', { name: 'Submit application' }).closest('form')!);
  const summary = await screen.findByRole('alert');
  await waitFor(() => expect(document.activeElement).toBe(summary));
  expect(summary.querySelector('a')?.getAttribute('href')).toBe('#email');
  expect(screen.getByLabelText('Student number (required)')).toHaveProperty('value', '00123-A');
  expect(screen.getByLabelText('Password (required)')).toHaveProperty('value', '');
  expect(submitted).toBe(false);
  screen.getByLabelText('School email (required)').focus();
  fireEvent.submit(screen.getByRole('button', { name: 'Submit application' }).closest('form')!);
  await waitFor(() => expect(document.activeElement).toBe(summary));
});
it('transport errors focus committed guidance without waiting for an animation frame, retain text and clear password', async () => {
  vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
  render(
    <SignUpForm
      role="student"
      submit={async () => {
        throw Error('network');
      }}
      resend={resend}
    />
  );
  fill();
  fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
  fireEvent.submit(screen.getByRole('button', { name: 'Submit application' }).closest('form')!);
  const feedback = await screen.findByRole('alert');
  expect(feedback.textContent).toContain('confirm the result');
  await waitFor(() => expect(document.activeElement).toBe(feedback));
  expect(screen.getByLabelText('Full name (required)')).toHaveProperty(
    'value',
    'Synthetic applicant'
  );
  expect(screen.getByLabelText('Password (required)')).toHaveProperty('value', '');
  expect(screen.getByLabelText('Password (required)')).toHaveProperty('type', 'password');
});
it.each(['queued', 'undisclosed'] as const)(
  'accepted %s claims queued mail only for bound enqueue',
  async (verification) => {
    render(
      <SignUpForm
        role="student"
        submit={async () => ({ ok: true, code: 'accepted', verification })}
        resend={resend}
      />
    );
    fill();
    fireEvent.submit(screen.getByRole('button', { name: 'Submit application' }).closest('form')!);
    if (verification === 'queued') {
      expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeTruthy();
      expect(screen.getByRole('status').textContent).toContain('Verification email queued');
    } else {
      expect(await screen.findByRole('alert')).toHaveProperty(
        'textContent',
        expect.stringContaining('could not use these details')
      );
      expect(screen.queryByText(/Verification email queued/)).toBeNull();
      expect(screen.getByLabelText('Password (required)')).toHaveProperty('value', '');
    }
  }
);

it('pending submission disables repeats, then focuses mounted feedback without stealing later typing focus', async () => {
  const response = Promise.withResolvers<Awaited<ReturnType<typeof unavailable>>>();
  render(<SignUpForm role="faculty" submit={() => response.promise} resend={resend} />);
  fill('faculty');
  const submit = screen.getByRole('button', { name: 'Submit application' });
  fireEvent.submit(submit.closest('form')!);
  expect(submit).toHaveProperty('disabled', true);
  expect(screen.queryByRole('alert')).toBeNull();
  await act(async () => response.resolve(await unavailable()));
  const feedback = await screen.findByRole('alert');
  await waitFor(() => expect(document.activeElement).toBe(feedback));
  expect(submit).toHaveProperty('disabled', false);
  const name = screen.getByLabelText('Full name (required)');
  name.focus();
  fireEvent.change(name, { target: { value: 'Synthetic edited after failure' } });
  expect(document.activeElement).toBe(name);
});
