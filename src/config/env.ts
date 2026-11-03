import 'server-only';

function required(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing ${name}`);
  return value;
}

export function getAppEnv(): {
  appOrigin: URL;
  supabaseUrl: string;
  publishableKey: string;
} {
  let appOrigin: URL;
  try {
    appOrigin = new URL(required('APP_ORIGIN'));
  } catch {
    throw new Error('Invalid APP_ORIGIN: an HTTPS origin is required');
  }
  if (
    appOrigin.protocol !== 'https:' ||
    appOrigin.username ||
    appOrigin.password ||
    appOrigin.pathname !== '/' ||
    appOrigin.search ||
    appOrigin.hash
  )
    throw new Error('Invalid APP_ORIGIN: an HTTPS origin is required');
  return {
    appOrigin,
    supabaseUrl: required('SUPABASE_URL'),
    publishableKey: required('SUPABASE_PUBLISHABLE_KEY'),
  };
}

export function getAdminEnv(): { secretKey: string; demoProjectRef: string } {
  return {
    secretKey: required('SUPABASE_SECRET_KEY'),
    demoProjectRef: required('DEMO_PROJECT_REF'),
  };
}

export function getMailEnv(): {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
} {
  const host = required('SMTP_HOST');
  const port = Number(required('SMTP_PORT'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid SMTP_PORT');
  }
  return {
    host,
    port,
    user: required('SMTP_USER'),
    password: required('SMTP_PASSWORD'),
    from: required('SMTP_FROM'),
  };
}
