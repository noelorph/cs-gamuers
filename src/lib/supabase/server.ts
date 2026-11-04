import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getAdminEnv, getAppEnv } from '@/config/env';
import { createRequestAuth } from './auth';
import { userTransport } from './user-transport.mjs';
import type { Database } from './database.types';

export async function createRequestClient() {
  const auth = await createRequestAuth();
  const { data, error } = await auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new Error('Authentication required');
  const verified = await auth.getUser(token);
  if (verified.error || !verified.data.user) throw new Error('Authentication required');
  const { supabaseUrl } = getAppEnv();
  const { secretKey } = getAdminEnv();
  return createClient<Database>(supabaseUrl, secretKey, {
    accessToken: async () => token,
    global: { fetch: userTransport(supabaseUrl, secretKey) },
  });
}
