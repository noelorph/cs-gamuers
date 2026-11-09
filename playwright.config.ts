import { defineConfig, devices } from '@playwright/test';
const rehearsal = process.env.PLAYWRIGHT_BASE_URL;
if (rehearsal) {
  const url = new URL(rehearsal);
  if (
    !process.env.APP_ORIGIN ||
    url.origin !== new URL(process.env.APP_ORIGIN).origin ||
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('Use an explicit local HTTPS rehearsal origin');
}
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: rehearsal || 'http://127.0.0.1:3000' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: rehearsal
    ? undefined
    : {
        command: 'npm run start -- --hostname 127.0.0.1 --port 3000',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: false,
      },
});
