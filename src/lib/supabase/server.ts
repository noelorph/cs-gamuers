import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAppEnv } from '@/config/env';
import type { Database } from './database.types';

export async function createRequestClient() {
  const store = await cookies();
  const { supabaseUrl, publishableKey } = getAppEnv();
  const cookieOptions = { secure: true, httpOnly: true, sameSite: 'lax' as const, path: '/' };
  return createServerClient<Database>(supabaseUrl, publishableKey, {
    cookieOptions,
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values)
          store.set(name, value, { ...options, ...cookieOptions });
      },
    },
  });
}
