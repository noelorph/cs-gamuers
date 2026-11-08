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
    test.setTimeout(60_000);
    const account = await fixtures.createFixture('faculty');
    await fixtures.harness('state', { account_id: account.id, status: 'approved' });
    async function signIn() {
      await page.goto('/auth/sign-in');
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(/\/faculty$/);
    }
    await signIn();
    await page.getByRole('main').getByRole('link', { name: 'Course drafts' }).click();
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
    await page.getByRole('button', { name: 'Toggle Sidebar', exact: true }).click();
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
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
  test('another Faculty cannot open an existing draft and revocation during save retains input', async ({
    page,
    browser,
  }) => {
    test.setTimeout(60_000);
    const owner = await fixtures.createFixture('faculty');
    const other = await fixtures.createFixture('faculty');
    for (const account of [owner, other])
      await fixtures.harness('state', { account_id: account.id, status: 'approved' });
    async function signIn(target: typeof page, email: string) {
      await target.goto('/auth/sign-in');
      await target.getByLabel('Email').fill(email);
      await target
        .getByLabel('Password (required)', { exact: true })
        .fill(fixtures.fixturePassword);
      await target.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(target).toHaveURL(/\/faculty$/);
    }
    await signIn(page, owner.email);
    await page.getByRole('main').getByRole('link', { name: 'Course drafts' }).click();
    await page.getByRole('link', { name: 'New draft' }).click();
    await page.getByLabel('Title').fill('Owner-only saved draft');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page).toHaveURL(/\/faculty\/courses\/[0-9a-f-]{36}$/);
    const url = page.url();
    const courseId = new URL(url).pathname.split('/').at(-1)!;
    const otherContext = await browser.newContext({ baseURL: process.env.PLAYWRIGHT_BASE_URL });
    try {
      const otherPage = await otherContext.newPage();
      await signIn(otherPage, other.email);
      await otherPage.goto(url);
      await expect(otherPage.getByText('Draft unavailable.')).toBeVisible();
      await expect(otherPage.getByLabel('Title')).toHaveCount(0);
      await expect(otherPage.getByRole('button', { name: 'Save draft' })).toHaveCount(0);
      await expect(otherPage.getByRole('button', { name: 'Delete draft' })).toHaveCount(0);
    } finally {
      await otherContext.close();
    }
    await page.getByLabel('Title').fill('Unsaved after revocation');
    let revoked = false;
    await page.route('**/faculty/courses/**', async (route) => {
      if (route.request().method() === 'POST' && !revoked) {
        await fixtures.harness('cutoff', { account_id: owner.id });
        revoked = true;
      }
      await route.continue();
    });
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Your session expired');
    expect(revoked).toBe(true);
    await expect(page.getByLabel('Title')).toHaveValue('Unsaved after revocation');
    await expect(page.getByRole('status')).not.toContainText('Draft saved');
    await page.unrouteAll();
    const fresh = await fixtures.signIn(owner);
    const persisted = await fresh.client
      .from('course_drafts')
      .select('details,version')
      .eq('id', courseId)
      .single();
    expect(persisted.error).toBeNull();
    expect(persisted.data?.version).toBe(1);
    expect(persisted.data?.details).toMatchObject({ title: 'Owner-only saved draft' });
  });
  test('lost blank-create response survives history and an explicit retry updates the same draft', async ({
    page,
  }) => {
    test.setTimeout(60_000);
    const owner = await fixtures.createFixture('faculty');
    await fixtures.harness('state', { account_id: owner.id, status: 'approved' });
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill(owner.email);
    await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/faculty$/);
    await page.getByRole('main').getByRole('link', { name: 'Course drafts' }).click();
    await page.getByRole('link', { name: 'New draft' }).click();
    await expect(page.getByLabel('Title')).toHaveValue('');
    let lostResponse = false;
    await page.route('**/faculty/courses/**', async (route) => {
      if (route.request().method() === 'POST' && !lostResponse) {
        lostResponse = true;
        const committed = await route.fetch();
        await committed.body();
        await route.abort();
      } else {
        await route.continue();
      }
    });
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('could not be confirmed');
    expect(lostResponse).toBe(true);
    await expect(page).toHaveURL(/\/faculty\/courses\/new$/);
    await expect(page.getByRole('status')).not.toContainText('Draft saved');
    await page.unrouteAll();
    await page.goBack();
    await expect(page).toHaveURL(/\/faculty\/courses$/);
    await page.goForward();
    await expect(page).toHaveURL(/\/faculty\/courses\/new$/);
    await expect(page.getByRole('main').getByRole('alert')).toContainText('could not be confirmed');
    await expect(page.getByLabel('Title')).toHaveValue('');
    await page.getByLabel('Title').fill('Entered after uncertain blank creation');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'recovered with different details'
    );
    await expect(page.getByLabel('Title')).toHaveValue('Entered after uncertain blank creation');
    await expect(page).toHaveURL(/\/faculty\/courses\/new$/);
    await expect(page.getByRole('status')).not.toContainText('Draft saved');
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page).toHaveURL(/\/faculty\/courses\/[0-9a-f-]{36}$/);
    await expect(page.getByLabel('Title')).toHaveValue('Entered after uncertain blank creation');
    const fresh = await fixtures.signIn(owner);
    const persisted = await fresh.client
      .from('course_drafts')
      .select('details,version')
      .eq('owner_id', owner.id);
    expect(persisted.error).toBeNull();
    expect(persisted.data).toHaveLength(1);
    expect(persisted.data?.[0].version).toBe(2);
    expect(persisted.data?.[0].details).toMatchObject({
      title: 'Entered after uncertain blank creation',
    });
  });
});
