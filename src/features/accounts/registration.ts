import 'server-only';
import { randomBytes } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { admitAuthRequest, AuthenticationThrottled } from '@/lib/supabase/auth';
import { assertMutationOrigin } from '@/lib/request-security';
import { getAppEnv } from '@/config/env';
import { validateAccountInput } from './validation';
import { proofHash } from './email-protocol';
import { capabilityOptions } from './email-links';
import type { AccountInput } from './types';
export type RegistrationResult =
  | { ok: true; code: 'accepted'; verification: 'queued' | 'undisclosed' }
  | { ok: false; code: 'validation'; errors: Partial<Record<keyof AccountInput, string>> }
  | { ok: false; code: 'throttled' | 'unavailable' };
export type VerificationResult =
  | { ok: true; code: 'acknowledged' }
  | { ok: false; code: 'invalid_input' | 'throttled' | 'unavailable' };
const registrationCookie = '__Host-registration';
async function admit() {
  const requestHeaders = await headers();
  const request = new Request(new URL('/auth/v1/signup', getAppEnv().supabaseUrl), {
    method: 'POST',
    headers: requestHeaders,
  });
  assertMutationOrigin(request);
  await admitAuthRequest(request, requestHeaders);
}
function failure(error: unknown): { ok: false; code: 'throttled' | 'unavailable' } {
  return {
    ok: false,
    code: error instanceof AuthenticationThrottled ? 'throttled' : 'unavailable',
  };
}
async function issueVerification(
  email: string,
  boundRegistration: boolean
): Promise<
  | { ok: true; code: 'acknowledged'; queued: boolean }
  | { ok: false; code: 'throttled' | 'unavailable' }
> {
  if (
    process.env.AUTH_MAIL_HOOK_VERIFIED_PROJECT_REF !==
    new URL(getAppEnv().supabaseUrl).hostname.split('.')[0]
  )
    return { ok: false, code: 'unavailable' };
  const admin = createAdminClient();
  const result = await admin.rpc('request_registration_verification', { email });
  if (result.error || !result.data) return { ok: false, code: 'unavailable' };
  if (result.data === 'throttled') return { ok: false, code: 'throttled' };
  if (result.data !== 'acknowledge') {
    try {
      const target = await admin.auth.admin.getUserById(result.data);
      if (target.error || target.data.user?.email !== email)
        throw new Error('Verification unavailable');
      if (target.data.user.email_confirmed_at)
        return { ok: true, code: 'acknowledged', queued: false };
      const sent = await admin.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: new URL('/auth/email', getAppEnv().appOrigin).href },
      });
      if (sent.error?.status === 429) throw new AuthenticationThrottled();
      if (sent.error) throw sent.error;
      return { ok: true, code: 'acknowledged', queued: true };
    } catch (error) {
      // Unbound callers must not learn which addresses require native lookup or mail.
      if (boundRegistration) return failure(error);
    }
  }
  return { ok: true, code: 'acknowledged', queued: false };
}
export async function registerAccount(input: unknown): Promise<RegistrationResult> {
  try {
    await admit();
    const validated = validateAccountInput(input);
    if ('errors' in validated) return { ok: false, code: 'validation', errors: validated.errors };
    const value = validated.data;
    const jar = await cookies();
    let capability = jar.get(registrationCookie)?.value;
    if (!capability || !/^[a-f0-9]{64}$/.test(capability)) {
      capability = randomBytes(32).toString('hex');
      jar.set(registrationCookie, capability, { ...capabilityOptions, maxAge: 1800 });
    }
    const admin = createAdminClient();
    const capabilityHash = proofHash(capability);
    const reserve = async () => {
      const result = await admin.rpc('reserve_registration', {
        capability_hash: capabilityHash,
        email: value.email,
        role: value.role,
        full_name: value.fullName,
        student_number: value.studentNumber ?? undefined,
        employee_number: value.employeeNumber ?? undefined,
      });
      if (result.error) throw new Error('Registration unavailable');
      return result.data as { reservation_id: string; account_id: string | null } | null;
    };
    let reservation = await reserve();
    if (reservation && !reservation.account_id) {
      try {
        await admin.auth.admin.createUser({
          email: value.email,
          password: value.password,
          email_confirm: false,
          app_metadata: { account_reservation_id: reservation.reservation_id },
          user_metadata: {
            full_name: value.fullName,
            role: value.role,
            ...(value.studentNumber && { student_number: value.studentNumber }),
          },
        });
      } catch {
        // Resolve even when the provider committed but its response was lost.
      }
      reservation = await reserve();
      if (!reservation?.account_id) return { ok: false, code: 'unavailable' };
    }
    let queued = false;
    if (reservation) {
      const verification = await issueVerification(value.email, true);
      if (!verification.ok) return verification;
      queued = verification.queued;
    }
    jar.set(registrationCookie, '', { ...capabilityOptions, maxAge: 0 });
    return { ok: true, code: 'accepted', verification: queued ? 'queued' : 'undisclosed' };
  } catch (error) {
    return failure(error);
  }
}
export async function resendVerification(email: string): Promise<VerificationResult> {
  try {
    await admit();
    if (typeof email !== 'string') return { ok: false, code: 'invalid_input' };
    email = email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, code: 'invalid_input' };
    const result = await issueVerification(email, false);
    return result.ok ? { ok: true, code: 'acknowledged' } : result;
  } catch (error) {
    return failure(error);
  }
}
