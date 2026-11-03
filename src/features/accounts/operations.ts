import 'server-only';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { finishInvitation } from './email-protocol';
import { capabilityCookie, capabilityOptions, readEmailCapability } from './email-links';

export async function completeInvitation(
  operationId: string,
  input: { fullName: string; password: string }
): Promise<{ complete: true }> {
  const capability = await readEmailCapability();
  if (!/^[a-f0-9-]{36}$/.test(operationId)) throw new Error('Confirm the email link again.');
  const result = await finishInvitation(createAdminClient(), operationId, capability, input);
  (await cookies()).set(capabilityCookie, '', { ...capabilityOptions, maxAge: 0 });
  return result;
}
