import 'server-only';
import { paths } from '@/config/paths';
import { createRequestAuth, createStagedAuth, AuthenticationThrottled } from '@/lib/supabase/auth';
import { createUserClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type SignInResult =
  | { ok: true; destination: string }
  | { ok: false; code: 'wrong_portal'; destination: '/auth/sign-in' | '/admin/sign-in' }
  | { ok: false; code: 'invalid_credentials' | 'throttled' | 'unavailable' | 'deactivated' };
export type SignInPortal = 'standard' | 'admin';
export async function signIn(
  input: { email: string; password: string },
  portal: SignInPortal
): Promise<SignInResult> {
  let attemptedToken: string | undefined;
  const result: SignInResult = await (async () => {
    try {
      const email = input.email.trim().toLowerCase();
      if (
        !email ||
        Buffer.byteLength(email) > 254 ||
        !input.password ||
        Buffer.byteLength(input.password) > 72
      )
        return { ok: false, code: 'invalid_credentials' };
      const staged = await createStagedAuth();
      const { data, error } = await staged.auth.signInWithPassword({
        email,
        password: input.password,
      });
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
      attemptedToken = data.session.access_token;
      const client = createUserClient(attemptedToken);
      const result = await client.rpc('current_actor');
      if (result.error) return { ok: false, code: 'unavailable' };
      const actor = result.data?.[0];
      if (!actor) {
        const status = await client.rpc('account_status');
        return {
          ok: false,
          code: !status.error && status.data?.[0]?.active === false ? 'deactivated' : 'unavailable',
        };
      }
      if (!actor.active) return { ok: false, code: 'deactivated' };
      if ((actor.role === 'administrator') !== (portal === 'admin'))
        return { ok: false, code: 'wrong_portal', destination: paths.login(actor.role) };
      staged.commit();
      attemptedToken = undefined;
      return {
        ok: true,
        destination:
          actor.application_status === 'approved' ? paths.roleHome(actor.role) : paths.authStatus,
      };
    } catch (error) {
      return {
        ok: false,
        code: error instanceof AuthenticationThrottled ? 'throttled' : 'unavailable',
      };
    }
  })();
  // Only the newly attempted session is discarded; existing browser sessions stay intact.
  if (attemptedToken) {
    try {
      const discarded = await createAdminClient().auth.admin.signOut(attemptedToken, 'local');
      if (discarded.error) return { ok: false, code: 'unavailable' };
    } catch {
      return { ok: false, code: 'unavailable' };
    }
  }
  return result;
}

export async function signOut(returnPortal?: unknown): Promise<'/auth/sign-in' | '/admin/sign-in'> {
  const auth = await createRequestAuth();
  const { data, error } = await auth.getSession();
  if (error) throw new Error('Sign out unavailable');
  // This allowlisted hint only chooses the return page when canonical access has ended.
  let destination: '/auth/sign-in' | '/admin/sign-in' = paths.login(
    returnPortal === 'admin' ? 'administrator' : 'student'
  );
  if (data.session) {
    const actor = await createUserClient(data.session.access_token).rpc('current_actor');
    if (!actor.error && actor.data?.[0]) destination = paths.login(actor.data[0].role);
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
  return destination;
}
