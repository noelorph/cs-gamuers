'use server';
import { headers } from 'next/headers';
import { getAppEnv } from '@/config/env';
import { confirmEmailChallenge, prepareEmailCapability } from '@/features/accounts/email-links';
import { completeInvitation } from '@/features/accounts/operations';

async function requireOrigin() {
  if ((await headers()).get('origin') !== getAppEnv().appOrigin.origin)
    throw new Error('Use the original application page.');
}
export async function prepareConfirmation() {
  try {
    await requireOrigin();
    await prepareEmailCapability();
  } catch {
    return { error: 'Open the original HTTPS email link on the demonstration network.' };
  }
}
export async function confirmEmail(challenge: string) {
  try {
    await requireOrigin();
    return await confirmEmailChallenge(challenge);
  } catch {
    return {
      error:
        'This link is unavailable or still resolving. Retry shortly, or ask the operator for a new email.',
    };
  }
}
export async function acceptInvitation(
  operationId: string,
  input: { fullName: string; password: string }
) {
  try {
    await requireOrigin();
    return await completeInvitation(operationId, input);
  } catch {
    return {
      error:
        'Setup could not be completed. Check your details, retry shortly, or ask the operator for a new email.',
    };
  }
}
