import { expect, test } from '@playwright/test';
for (const width of [1280, 320]) {
  test(`sign-in labels, keyboard and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/auth/sign-in');
    await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'username');
    await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute(
      'autocomplete',
      'current-password'
    );
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false
    );
  });
}
test('cross-origin sign-out is rejected and GET cannot sign out', async ({ request }) => {
  expect(
    (
      await request.post('/auth/sign-out', { headers: { origin: 'https://attacker.invalid' } })
    ).status()
  ).toBe(403);
  expect((await request.get('/auth/sign-out')).status()).toBe(405);
});
test('all protected destinations refuse a missing session', async ({ page }) => {
  for (const path of ['/student', '/faculty', '/program-head', '/admin', '/auth/status']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  }
});

test('a failed submission gives a focused error and retains a long email', async ({ page }) => {
  await page.goto('/auth/sign-in');
  await page.route('**/auth/sign-in', (route) =>
    route.request().method() === 'POST' ? route.abort() : route.continue()
  );
  const email = 'synthetic-' + 'x'.repeat(160) + '@example.invalid';
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('synthetic password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('unavailable');
  await expect(page.getByRole('main').getByRole('alert')).toBeFocused();
  await expect(page.getByLabel('Email')).toHaveValue(email);
});

test.describe('explicit synthetic HTTPS rehearsal', () => {
  test.skip(
    process.env.E2E_AUTH_PROJECT_REF !== 'ggiccvcrkydcimveyrfi',
    'Requires explicitly allowlisted synthetic TEST target and verified private gateway'
  );
  let fixtures: typeof import('../integration/helpers/fixtures');
  test.beforeAll(async () => {
    if (
      !process.env.PLAYWRIGHT_BASE_URL ||
      process.env.PLAYWRIGHT_BASE_URL !== process.env.APP_ORIGIN ||
      process.env.AUTH_PASSWORD_GATE_VERIFIED_PROJECT_REF !== 'ggiccvcrkydcimveyrfi'
    )
      throw new Error('Trusted HTTPS target and verified TEST private gateway required');
    fixtures = await import('../integration/helpers/fixtures');
  });
  test.afterAll(async () => {
    if (fixtures) await fixtures.cleanFixtures();
  });
  for (const [role, destination] of [
    ['student', '/student'],
    ['faculty', '/faculty'],
    ['program_head', '/program-head'],
    ['administrator', '/admin'],
  ]) {
    test(`${role} signs in, signs out, and cannot return with browser Back`, async ({ page }) => {
      const account = await fixtures.createFixture(role);
      await fixtures.harness('state', { account_id: account.id, status: 'approved' });
      await page.goto('/auth/sign-in');
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Password', { exact: true }).fill(fixtures.fixturePassword);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${destination}$`));
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL(/\/auth\/sign-in$/);
      await page.goBack();
      await expect(page).toHaveURL(/\/auth\/sign-in$/);
    });
  }
  test('pending applicants see status and no staff destination', async ({ page }) => {
    const account = await fixtures.createFixture('faculty');
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(fixtures.fixturePassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/status$/);
    await expect(page.getByRole('heading', { name: 'Pending review' })).toBeVisible();
  });
});
