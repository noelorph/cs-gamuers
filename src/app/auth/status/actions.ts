'use server';
import { headers } from 'next/headers';
import { getAppEnv } from '@/config/env';
import { admitAuthRequest } from '@/lib/supabase/auth';
import { assertMutationOrigin } from '@/lib/request-security';
import {
  getApplication,
  saveApplication,
  resubmitApplication,
} from '@/features/accounts/applications';
export async function readApplication() {
  return getApplication();
}
export async function saveCorrection(
  version: number,
  input: { fullName: string; studentNumber: string | null; employeeNumber: string | null }
) {
  assertMutationOrigin(
    new Request('https://local.invalid', { method: 'POST', headers: await headers() })
  );
  return saveApplication(version, input);
}
export async function resubmitCorrection(version: number) {
  assertMutationOrigin(
    new Request('https://local.invalid', { method: 'POST', headers: await headers() })
  );
  return resubmitApplication(version);
}
export async function verifyReplacement(version: number, email: string) {
  assertMutationOrigin(
    new Request('https://local.invalid', { method: 'POST', headers: await headers() })
  );
  await admitAuthRequest(
    new Request(new URL('/auth/v1/user', getAppEnv().supabaseUrl), { method: 'PUT' }),
    await headers()
  );
  const { requestApplicationEmail } = await import('@/features/accounts/applications');
  return requestApplicationEmail(version, email);
}
export async function cancelReplacement(version: number) {
  assertMutationOrigin(
    new Request('https://local.invalid', { method: 'POST', headers: await headers() })
  );
  const { cancelApplicationEmail } = await import('@/features/accounts/applications');
  return cancelApplicationEmail(version);
}
