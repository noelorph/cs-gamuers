import 'server-only';
import { cookies, headers } from 'next/headers';
import { getAppEnv } from '@/config/env';
import { randomBytes } from 'node:crypto';
import { createProofAuthClient, admitAuthRequest } from '@/lib/supabase/auth';
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
export async function confirmEmailChallenge(challenge: string): Promise<{
  operationId: string;
  purpose: 'verification' | 'invitation' | 'replacement';
  invitation?: { email: string; role: 'administrator' | 'program_head' };
}> {
  const capability = await readEmailCapability();
  const native = await createProofAuthClient();
  const result = await confirmProof(createAdminClient(), native, challenge, capability, async () =>
    admitAuthRequest(
      new Request(new URL('/auth/v1/user', getAppEnv().supabaseUrl), { method: 'PUT' }),
      await headers()
    )
  );
  const jar = await cookies();
  jar.set(capabilityCookie, jar.get(capabilityCookie)!.value, {
    ...capabilityOptions,
    expires: new Date(result.expiresAt),
  });
  return {
    operationId: result.operationId,
    purpose: result.purpose,
    ...(result.invitation && { invitation: result.invitation }),
  };
}
