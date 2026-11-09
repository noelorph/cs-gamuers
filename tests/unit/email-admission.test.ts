// @vitest-environment node
import { expect, test, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const mocks = vi.hoisted(() => ({ admit: vi.fn(), complete: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ origin: 'https://demo.invalid' }),
}));
vi.mock('@/config/env', () => ({
  getAppEnv: () => ({
    appOrigin: new URL('https://demo.invalid'),
    supabaseUrl: 'https://example.supabase.co',
  }),
}));
vi.mock('@/lib/supabase/auth', () => ({ admitAuthRequest: mocks.admit }));
vi.mock('@/features/accounts/email-links', () => ({
  confirmEmailChallenge: vi.fn(),
  prepareEmailCapability: vi.fn(),
}));
vi.mock('@/features/accounts/operations', () => ({ completeInvitation: mocks.complete }));
import { acceptInvitation } from '@/app/auth/email/actions';
test('password setup cannot reach its privileged operation after shared source admission fails', async () => {
  mocks.admit.mockRejectedValue(Error('throttled'));
  mocks.complete.mockResolvedValue({ ok: true });
  expect(
    await acceptInvitation('synthetic', { fullName: 'Synthetic', password: 'synthetic password' })
  ).toHaveProperty('error');
  expect(mocks.complete).not.toHaveBeenCalled();
});
