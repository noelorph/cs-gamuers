import 'server-only';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { createProofAuthClient } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { confirmProof, proofHash } from './email-protocol';

export const capabilityCookie = '__Host-account-proof';
export const capabilityOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict' as const,
  path: '/',
};
export async function prepareEmailCapability() {
  const jar = await cookies();
  if (!/^[a-f0-9]{64}$/.test(jar.get(capabilityCookie)?.value ?? '')) {
    jar.set(capabilityCookie, randomBytes(32).toString('hex'), {
      ...capabilityOptions,
      maxAge: 1800,
    });
  }
}
export async function readEmailCapability() {
  const value = (await cookies()).get(capabilityCookie)?.value;
  if (!value || !/^[a-f0-9]{64}$/.test(value)) throw new Error('Confirm the email link again.');
  return proofHash(value);
}
export async function confirmEmailChallenge(
  challenge: string
): Promise<{ operationId: string; purpose: 'verification' | 'invitation' }> {
  const capability = await readEmailCapability();
  const native = await createProofAuthClient();
  const result = await confirmProof(createAdminClient(), native, challenge, capability);
  const jar = await cookies();
  jar.set(capabilityCookie, jar.get(capabilityCookie)!.value, {
    ...capabilityOptions,
    expires: new Date(result.expiresAt),
  });
  return { operationId: result.operationId, purpose: result.purpose };
}
