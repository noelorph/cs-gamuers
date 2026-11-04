// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
import { assertNativeMailTestReady } from '../integration/helpers/mail-safety';
afterEach(() => vi.unstubAllEnvs());
test('native mail tests fail explicitly before provider calls when actual hook readiness is absent or mismatched', () => {
  vi.stubEnv('TEST_SUPABASE_PROJECT_REF', 'ggiccvcrkydcimveyrfi');
  for (const value of [undefined, 'different-project']) {
    vi.stubEnv('AUTH_MAIL_HOOK_VERIFIED_PROJECT_REF', value);
    expect(assertNativeMailTestReady).toThrow('Native mail tests blocked');
  }
  vi.stubEnv('AUTH_MAIL_HOOK_VERIFIED_PROJECT_REF', 'ggiccvcrkydcimveyrfi');
  expect(assertNativeMailTestReady).not.toThrow();
});
