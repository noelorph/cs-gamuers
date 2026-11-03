import 'server-only';
import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateInvitationInput } from './validation';

export const proofHash = (value: string) => createHash('sha256').update(value).digest('hex');
const unavailable = () => new Error('This link is unavailable. Ask the operator for a new email.');
type Proof = {
  proof_id: string;
  account_id: string;
  purpose: 'verification' | 'invitation';
  state: 'claimed' | 'verified' | 'complete';
  operation_id: string | null;
  operation_state?: string;
  native_verifier?: string;
  native_type: 'signup' | 'invite' | 'recovery';
  recipient: string;
  expires_at: string;
};

async function advance(
  client: SupabaseClient,
  id: string,
  capabilityHash: string,
  step: string,
  fullName?: string
): Promise<Proof> {
  const result = await client.rpc('advance_email_operation', {
    proof_id: id,
    capability_hash: capabilityHash,
    step,
    full_name: fullName ?? null,
  });
  if (result.error || !result.data) throw unavailable();
  return result.data as Proof;
}

async function markPasswordOperation(client: SupabaseClient, proof: Proof, password?: string) {
  const { data, error } = await client.auth.admin.getUserById(proof.account_id);
  if (error || !data.user) throw unavailable();
  return client.auth.admin.updateUserById(proof.account_id, {
    ...(password !== undefined && { password }),
    app_metadata: { ...data.user.app_metadata, password_operation_id: proof.operation_id },
  });
}

async function clearMarker(client: SupabaseClient, proof: Proof) {
  const { data, error } = await client.auth.admin.getUserById(proof.account_id);
  if (error || !data.user || data.user.app_metadata.password_operation_id !== proof.operation_id)
    return;
  // A completed marker carries no authority; clearing it is safe to retry.
  await client.auth.admin.updateUserById(proof.account_id, {
    app_metadata: { ...data.user.app_metadata, password_operation_id: null },
  });
}

export async function confirmProof(
  client: SupabaseClient,
  nativeClient: SupabaseClient,
  challenge: string,
  capabilityHash: string
) {
  if (!/^[a-f0-9]{64}$/.test(challenge) || !/^[a-f0-9]{64}$/.test(capabilityHash))
    throw unavailable();
  const claimed = await client.rpc('claim_email_challenge', {
    challenge_hash: proofHash(challenge),
    capability_hash: capabilityHash,
  });
  if (claimed.error || !claimed.data) throw unavailable();
  let proof = claimed.data as Proof;
  if (proof.state === 'claimed') {
    let state = await advance(client, proof.proof_id, capabilityHash, 'inspect');
    if (proof.native_type === 'invite' && state.operation_state !== 'auth_applied') {
      if (state.operation_state !== 'applying') throw unavailable();
      const marked = await markPasswordOperation(client, proof);
      if (marked.error) throw unavailable();
    }
    let nativeVerified = false;
    if (proof.native_type !== 'invite' || state.operation_state !== 'auth_applied') {
      if (!proof.native_verifier) throw unavailable();
      const verified = await nativeClient.auth
        .verifyOtp({ token_hash: proof.native_verifier, type: proof.native_type })
        .catch(() => null);
      nativeVerified =
        !!verified?.data.user &&
        verified.data.user.id === proof.account_id &&
        verified.data.user.email === proof.recipient &&
        !verified.error;
      // Neither native tokens nor the proof session leave this server-only call chain.
      await nativeClient.auth.signOut({ scope: 'global' });
    }
    state = await advance(client, proof.proof_id, capabilityHash, 'inspect');
    if (proof.native_type === 'invite') {
      if (state.operation_state !== 'auth_applied') throw unavailable();
      await clearMarker(client, proof);
    } else if (proof.native_type === 'recovery') {
      if (!nativeVerified) throw unavailable();
    } else {
      const user = await client.auth.admin.getUserById(proof.account_id);
      if (user.error || !user.data.user?.email_confirmed_at) throw unavailable();
    }
    proof = await advance(client, proof.proof_id, capabilityHash, 'redeemed');
  }
  return { operationId: proof.proof_id, purpose: proof.purpose, expiresAt: proof.expires_at };
}

export async function finishInvitation(
  client: SupabaseClient,
  operationId: string,
  capabilityHash: string,
  input: { fullName: string; password: string }
): Promise<{ complete: true }> {
  const validated = validateInvitationInput(input);
  if (!('data' in validated)) throw new Error('Check your name and password.');
  let proof = await advance(client, operationId, capabilityHash, 'inspect');
  if (proof.purpose !== 'invitation') throw unavailable();
  if (proof.state === 'complete') return { complete: true };
  if (proof.operation_state === 'verified') {
    proof = await advance(client, operationId, capabilityHash, 'apply', validated.data.fullName);
    await markPasswordOperation(client, proof, validated.data.password).catch(() => null);
    // Read the durable fence even when the Auth response is lost or reports failure.
    proof = await advance(client, operationId, capabilityHash, 'inspect');
  }
  if (proof.operation_state !== 'auth_applied')
    throw new Error('Setup is still resolving. Retry shortly or ask for a new email.');
  await advance(client, operationId, capabilityHash, 'finish');
  await clearMarker(client, proof);
  return { complete: true };
}
