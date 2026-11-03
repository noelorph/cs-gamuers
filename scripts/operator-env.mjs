import { loadEnvFile } from 'node:process';
import { createRequire } from 'node:module';
import { createClient } from '@supabase/supabase-js';
const { assertIsolatedTestTarget } = createRequire(import.meta.url)('../src/config/test-target.ts');
const required = (name) => {
  const value = process.env[name];
  if (!value?.trim()) throw Error(`Missing ${name}`);
  return value;
};
export function operatorEnvironment(test) {
  try {
    loadEnvFile('.env.local');
  } catch {
    /* Explicit shell configuration is supported. */
  }
  if (test) assertIsolatedTestTarget();
  const ref = required(test ? 'TEST_SUPABASE_PROJECT_REF' : 'DEMO_PROJECT_REF');
  const url = required(test ? 'TEST_SUPABASE_URL' : 'SUPABASE_URL');
  if (!/^[a-z0-9]{20}$/.test(ref) || url !== `https://${ref}.supabase.co`)
    throw Error('Refusing mismatched project URL.');
  const origin = new URL(required('APP_ORIGIN'));
  if (
    origin.protocol !== 'https:' ||
    origin.pathname !== '/' ||
    origin.search ||
    origin.hash ||
    origin.username ||
    origin.password
  )
    throw Error('APP_ORIGIN must be an HTTPS origin.');
  return {
    ref,
    url,
    origin: origin.origin,
    publishable: required(test ? 'TEST_SUPABASE_PUBLISHABLE_KEY' : 'SUPABASE_PUBLISHABLE_KEY'),
    secret: required(test ? 'TEST_SUPABASE_SECRET_KEY' : 'SUPABASE_SECRET_KEY'),
    hookReady: process.env.AUTH_MAIL_HOOK_VERIFIED_PROJECT_REF === ref,
  };
}
export function operatorClients(env) {
  const options = {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  };
  return {
    admin: createClient(env.url, env.secret, options),
    user: createClient(env.url, env.publishable, options),
  };
}
export function smtpEnvironment() {
  const port = Number(required('SMTP_PORT'));
  if (![465, 587].includes(port)) throw Error('Use SMTP TLS port 465 or STARTTLS port 587.');
  return {
    from: required('SMTP_FROM'),
    options: {
      host: required('SMTP_HOST'),
      port,
      secure: port === 465,
      requireTLS: true,
      auth: { user: required('SMTP_USER'), pass: required('SMTP_PASSWORD') },
      logger: false,
      debug: false,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
      disableFileAccess: true,
      disableUrlAccess: true,
    },
  };
}
export async function rpc(client, name, args) {
  const result = await client.rpc(name, args);
  if (result.error)
    throw Error(`Operation ${name} unavailable (${result.error.code || 'network'}).`);
  return result.data;
}
