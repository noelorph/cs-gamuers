// @vitest-environment node
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({
  createRequestClient: async () => ({ rpc: async () => ({ error: { code: '23505' } }) }),
}));
import { requestApplicationEmail, saveApplication } from '@/features/accounts/applications';
it('keeps replacement-email conflicts distinct from disputed student-number claims', async () => {
  expect(await requestApplicationEmail(1, 'fixture@caloocan.sti.edu.ph')).toEqual({
    ok: false,
    code: 'email_reserved',
  });
  expect(
    await saveApplication(1, {
      fullName: 'Synthetic',
      studentNumber: '00123',
      employeeNumber: null,
    })
  ).toEqual({ ok: false, code: 'number_reserved' });
});
