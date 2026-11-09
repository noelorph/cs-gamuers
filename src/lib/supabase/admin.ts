import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getAdminEnv, getAppEnv } from '@/config/env';
import type { Database } from './database.types';

// Call only after an account/maintenance operation establishes its authorization.
export function createAdminClient() {
  return createClient<Database>(getAppEnv().supabaseUrl, getAdminEnv().secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
