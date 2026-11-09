// @vitest-environment node
import { afterEach, expect, test, vi } from 'vitest';
const admin = vi.hoisted(() => ({
  rpc: vi.fn(),
  auth: { admin: { createUser: vi.fn(), deleteUser: vi.fn() } },
}));
vi.mock('@supabase/supabase-js', () => ({ createClient: () => admin }));
vi.mock('../integration/helpers/environment', () => ({ assertIsolatedTestTarget: vi.fn() }));
vi.mock('../integration/helpers/fixture-journal.mjs', () => ({ saveFixtureJournal: vi.fn() }));
vi.mock('node:process', () => ({ loadEnvFile: vi.fn() }));
vi.mock('node:fs/promises', () => ({ mkdir: vi.fn(), unlink: vi.fn() }));
afterEach(() => vi.unstubAllEnvs());
test('successive exact-run cleanup does not delete an already removed Auth user', async () => {
  vi.stubEnv('TEST_SUPABASE_PROJECT_REF', 'ggiccvcrkydcimveyrfi');
  vi.stubEnv('TEST_SUPABASE_URL', 'https://synthetic.invalid');
  vi.stubEnv('TEST_SUPABASE_SECRET_KEY', 'synthetic');
  admin.rpc.mockImplementation((_name, args) =>
    Promise.resolve({
      data: args.action === 'cleanup_ids' ? [] : { reservation_id: 'reservation' },
      error: null,
    })
  );
  admin.auth.admin.createUser.mockResolvedValue({
    data: { user: { id: 'synthetic-id' } },
    error: null,
  });
  admin.auth.admin.deleteUser.mockResolvedValue({ error: null });
  const fixtures = await import('../integration/helpers/fixtures');
  await fixtures.createFixture('faculty');
  await fixtures.cleanFixtures();
  await fixtures.cleanFixtures();
  expect(admin.auth.admin.deleteUser).toHaveBeenCalledTimes(1);
  expect(admin.auth.admin.deleteUser).toHaveBeenCalledWith('synthetic-id');
});
