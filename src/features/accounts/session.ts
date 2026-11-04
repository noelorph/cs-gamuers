import 'server-only';
import { paths } from '@/config/paths';
import { createRequestAuth, AuthenticationThrottled } from '@/lib/supabase/auth';
import { createRequestClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type SignInResult =
  | { ok: true; destination: string }
  | { ok: false; code: 'invalid_credentials' | 'throttled' | 'unavailable' };
export async function signIn(input: { email: string; password: string }): Promise<SignInResult> {
  try {
    const email = input.email.trim().toLowerCase();
    if (
      !email ||
      Buffer.byteLength(email) > 254 ||
      !input.password ||
      Buffer.byteLength(input.password) > 72
    )
      return { ok: false, code: 'invalid_credentials' };
    const auth = await createRequestAuth();
    const { data, error } = await auth.signInWithPassword({ email, password: input.password });
    if (error || !data.session) {
      if (error?.status === 429) return { ok: false, code: 'throttled' };
      return {
        ok: false,
        code: ['invalid_credentials', 'email_not_confirmed', 'validation_failed'].includes(
          error?.code ?? ''
        )
          ? 'invalid_credentials'
          : 'unavailable',
      };
    }
    const client = await createRequestClient();
    const result = await client.rpc('current_actor');
    if (result.error) return { ok: false, code: 'unavailable' };
    const actor = result.data?.[0];
    return {
      ok: true,
      destination:
        actor?.active && actor.application_status === 'approved'
          ? paths.roleHome(actor.role)
          : paths.authStatus,
    };
  } catch (error) {
    return {
      ok: false,
      code: error instanceof AuthenticationThrottled ? 'throttled' : 'unavailable',
    };
  }
}
export async function signOut(): Promise<void> {
  const auth = await createRequestAuth();
  const { data, error } = await auth.getSession();
  if (error) throw new Error('Sign out unavailable');
  if (data.session) {
    // Native removal plus the database auth.sessions predicate invalidates the captured JWT.
    const removed = await createAdminClient().auth.admin.signOut(
      data.session.access_token,
      'local'
    );
    if (removed.error) throw new Error('Sign out unavailable');
  }
  // The already-removed session makes this local cookie cleanup safe even on a second native call.
  const cleared = await auth.signOut({ scope: 'local' });
  if (cleared.error) throw new Error('Sign out unavailable');
}
