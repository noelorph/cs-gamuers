// @vitest-environment node
import { expect, test, vi } from 'vitest';
import { authenticationAdmission } from '@/lib/supabase/authentication-admission.mjs';
const request = (grant = 'password') =>
  new Request(`https://example.supabase.co/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    body: JSON.stringify({ email: ' User@Example.invalid ' }),
  });
test('an unverified gate fails closed before contacting Auth or reserving an attempt', async () => {
  const rpc = vi.fn();
  await expect(
    authenticationAdmission({ rpc }, 'example', '192.0.2.1', 'different', request())
  ).rejects.toThrow('unavailable');
  expect(rpc).not.toHaveBeenCalled();
});
test('failed or interrupted reservations remain failures; success clears only its exact identifier attempt', async () => {
  const rpc = vi.fn().mockResolvedValue({ data: 'attempt-id', error: null });
  const finish = await authenticationAdmission(
    { rpc },
    'example',
    '192.0.2.1',
    'example',
    request()
  );
  expect(rpc).toHaveBeenCalledWith('admit_authentication', {
    source_ip: '192.0.2.1',
    identifier: 'user@example.invalid',
  });
  await finish(false);
  expect(rpc).toHaveBeenCalledTimes(1);
  await finish(true);
  expect(rpc).toHaveBeenLastCalledWith('finish_authentication', {
    attempt_id: 'attempt-id',
    succeeded: true,
  });
});
test('refresh submissions share source admission and throttling propagates without native submission', async () => {
  const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
  await expect(
    authenticationAdmission({ rpc }, 'example', '192.0.2.1', 'example', request('refresh_token'))
  ).rejects.toMatchObject({ status: 429 });
  expect(rpc).toHaveBeenCalledWith('admit_authentication', {
    source_ip: '192.0.2.1',
    identifier: null,
  });
});
