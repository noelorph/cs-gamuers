import { expect, test } from '@playwright/test';
test.describe('isolated TEST Faculty drafts', () => {
  test.skip(
    process.env.E2E_AUTH_PROJECT_REF !== 'ggiccvcrkydcimveyrfi',
    'Requires verified isolated TEST authentication'
  );
  let fixtures: typeof import('../integration/helpers/fixtures');
  test.beforeAll(async () => {
    if (
      process.env.PLAYWRIGHT_BASE_URL !== process.env.APP_ORIGIN ||
      !process.env.APP_ORIGIN?.startsWith('https://') ||
      process.env.AUTH_PASSWORD_GATE_VERIFIED_PROJECT_REF !== 'ggiccvcrkydcimveyrfi'
    )
      throw Error('Trusted HTTPS and verified TEST gateway required');
    fixtures = await import('../integration/helpers/fixtures');
  });
  test.afterAll(async () => {
    if (fixtures) await fixtures.cleanFixtures();
  });
  test('empty list, incomplete creation, ordered edits, persistence, conflict and confirmed deletion', async ({
    page,
    context,
  }) => {
    const account = await fixtures.createFixture('faculty');
    await fixtures.harness('state', { account_id: account.id, status: 'approved' });
    async function signIn() {
      await page.goto('/auth/sign-in');
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Password', { exact: true }).fill(fixtures.fixturePassword);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    }
    await signIn();
    await page.getByRole('link', { name: 'Course drafts' }).click();
    await expect(page.getByText('No course drafts yet.')).toBeVisible();
    await page.setViewportSize({ width: 320, height: 800 });
    await page.getByRole('link', { name: 'New draft' }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false
    );
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page).toHaveURL(/\/faculty\/courses\/[0-9a-f-]{36}$/);
    const url = page.url();
    await expect(page.getByRole('button', { name: /Submit|Publish/ })).toHaveCount(0);
    await page.reload();
    await expect(page.getByLabel('Title')).toHaveValue('');
    await page.getByLabel('Title').fill('Synthetic course');
    await page.getByLabel('Description', { exact: true }).fill('<script>plain text</script>');
    await page.getByLabel('Primary topic').selectOption('Databases');
    await page.getByLabel('Difficulty', { exact: true }).selectOption('Advanced');
    await page.getByRole('button', { name: 'Add outcome' }).click();
    await page.getByLabel('Outcome 1', { exact: true }).fill('First');
    await page.getByRole('button', { name: 'Add outcome' }).click();
    await page.getByLabel('Outcome 2', { exact: true }).fill('Second');
    await page.getByRole('button', { name: 'Move outcome 2 up' }).click();
    await page.getByLabel('Recommended prior knowledge (optional)').fill('Basics');
    await page.getByLabel('Estimated hours (optional)').fill('2.5');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('status')).toContainText('Draft saved');
    await page.reload();
    await expect(page.getByLabel('Outcome 1', { exact: true })).toHaveValue('Second');
    const stale = await context.newPage();
    await stale.goto(url);
    await stale.getByLabel('Title').fill('Stale edits');
    await page.getByLabel('Title').fill('Current');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('status')).toContainText('Draft saved');
    await stale.getByRole('button', { name: 'Save draft' }).click();
    await expect(stale.getByRole('main').getByRole('alert')).toContainText('another tab');
    await expect(stale.getByLabel('Title')).toHaveValue('Stale edits');
    await stale.getByRole('button', { name: 'Delete draft' }).click();
    await stale.getByRole('button', { name: 'Confirm deletion' }).click();
    await expect(stale.getByRole('dialog').getByRole('alert')).toContainText('another tab');
    await stale.close();
    await page.getByLabel('Title').fill('x'.repeat(201));
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Check the fields');
    await expect(page.getByLabel('Title')).toHaveValue('x'.repeat(201));
    await page.goBack();
    await expect(page).toHaveURL(/\/faculty\/courses$/);
    await page.goForward();
    await expect(page).toHaveURL(url);
    await expect(page.getByLabel('Title')).toHaveValue('x'.repeat(201));
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Check the fields');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false
    );
    await page.getByLabel('Title').fill('Current');
    await page.route('**/faculty/courses/**', (route) =>
      route.request().method() === 'POST' ? route.abort() : route.continue()
    );
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('could not be confirmed');
    await expect(page.getByLabel('Title')).toHaveValue('Current');
    await page.unrouteAll();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Sign out' }).click();
    await signIn();
    await page.goto(url);
    await expect(page.getByLabel('Title')).toHaveValue('Current');
    await page.goto('/faculty/courses/00000000-0000-4000-8000-000000000001');
    await expect(page.getByText('Draft unavailable.')).toBeVisible();
    await page.goto(url);
    await page.getByRole('button', { name: 'Delete draft' }).click();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Delete draft' })).toBeFocused();
    await page.getByRole('button', { name: 'Delete draft' }).click();
    await page.getByRole('button', { name: 'Confirm deletion' }).click();
    await expect(page).toHaveURL(/\/faculty\/courses$/);
    await expect(page.getByText('No course drafts yet.')).toBeVisible();
  });
});
