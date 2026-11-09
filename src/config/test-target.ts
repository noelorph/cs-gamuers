function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}: isolated integration target required`);
  return value;
}

function hostedProjectRef(name: string): string {
  let url: URL;
  try {
    url = new URL(required(name));
  } catch {
    throw new Error(`Invalid ${name}: hosted Supabase HTTPS URL required`);
  }
  const match = /^([a-z0-9-]+)\.supabase\.co$/.exec(url.hostname);
  if (
    !match ||
    url.protocol !== 'https:' ||
    url.port ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error(`Invalid ${name}: hosted Supabase HTTPS URL required`);
  return match[1];
}

export function assertIsolatedTestTarget(): void {
  const demoRef = required('DEMO_PROJECT_REF').toLowerCase();
  const testRef = required('TEST_SUPABASE_PROJECT_REF').toLowerCase();
  const demoUrlRef = hostedProjectRef('SUPABASE_URL');
  const testUrlRef = hostedProjectRef('TEST_SUPABASE_URL');
  if (
    testRef === demoRef ||
    testUrlRef === demoUrlRef ||
    testUrlRef === demoRef ||
    testRef === demoUrlRef ||
    testUrlRef !== testRef ||
    demoUrlRef !== demoRef
  )
    throw new Error('Refusing non-isolated or mismatched integration target');
}
