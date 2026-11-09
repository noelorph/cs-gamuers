import 'server-only';
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';
import { connection } from 'next/server';
import { getAdminEnv, getAppEnv } from '@/config/env';
import { trustedSourceIp } from '@/lib/request-security';
import { createAdminClient } from './admin';
import { userTransport } from './user-transport.mjs';

export const sessionCookieOptions = {
  secure: true,
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
};
export { AuthenticationThrottled } from './authentication-admission.mjs';
import { authenticationAdmission } from './authentication-admission.mjs';
export async function admitAuthRequest(request: Request, requestHeaders: Headers) {
  const { supabaseUrl } = getAppEnv();
  return authenticationAdmission(
    createAdminClient(),
    new URL(supabaseUrl).hostname.split('.')[0],
    trustedSourceIp(requestHeaders),
    process.env.AUTH_PASSWORD_GATE_VERIFIED_PROJECT_REF,
    request
  );
}
export function createCookieAuth(cookieMethods: CookieMethodsServer, requestHeaders: Headers) {
  const { supabaseUrl } = getAppEnv();
  const { secretKey } = getAdminEnv();
  return createServerClient(supabaseUrl, secretKey, {
    cookieOptions: sessionCookieOptions,
    cookies: cookieMethods,
    global: {
      fetch: userTransport(supabaseUrl, secretKey, fetch, (request: Request) =>
        admitAuthRequest(request, requestHeaders)
      ),
    },
  }).auth;
}
export async function createRequestAuth() {
  // SDK session expiry reads the clock, which partial-prefetch runtime shells prohibit.
  await connection();
  const store = await cookies();
  return createCookieAuth(
    {
      getAll: () => store.getAll(),
      // Rendering reads only: proxy owns refresh; actions own sign-in/out cookie writes.
      setAll: (values) => {
        for (const { name, value, options } of values) {
          try {
            store.set(name, value, { ...options, ...sessionCookieOptions });
          } catch {
            /* Proxy refreshes before rendering. */
          }
        }
      },
    },
    await headers()
  );
}
export async function createStagedAuth() {
  await connection();
  const store = await cookies();
  let pending: Parameters<NonNullable<CookieMethodsServer['setAll']>>[0] = [];
  const auth = createCookieAuth(
    {
      // Keep chunk names for replacement cleanup without loading or refreshing the old session.
      getAll: () => store.getAll().map(({ name }) => ({ name, value: '' })),
      setAll: (values) => {
        pending = values;
      },
    },
    await headers()
  );
  return {
    auth,
    commit() {
      for (const { name, value, options } of pending)
        store.set(name, value, { ...options, ...sessionCookieOptions });
    },
  };
}
export async function createProofAuthClient() {
  const { supabaseUrl } = getAppEnv();
  const { secretKey } = getAdminEnv();
  const requestHeaders = await headers();
  return createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: userTransport(supabaseUrl, secretKey, fetch, (request: Request) =>
        admitAuthRequest(request, requestHeaders)
      ),
    },
  });
}
