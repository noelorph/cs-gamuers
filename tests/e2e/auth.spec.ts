import { expect, test } from '@playwright/test';
for (const width of [1280, 320]) {
  for (const portal of ['/auth/sign-in', '/admin/sign-in'])
    test(`${portal} labels, keyboard and layout at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(portal);
      await expect(
        page.getByRole('heading', {
          name: portal === '/admin/sign-in' ? 'Administrator sign in' : 'Sign in',
          exact: true,
        })
      ).toBeVisible();
      await expect(page.getByLabel('Email')).toHaveAttribute('autocomplete', 'username');
      await expect(page.getByLabel('Password (required)', { exact: true })).toHaveAttribute(
        'autocomplete',
        'current-password'
      );
      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false
      );
      await page.getByLabel('Email').focus();
      await page.keyboard.press('Tab');
      await expect(page.getByLabel('Password (required)', { exact: true })).toBeFocused();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Space');
      await expect(page.getByRole('button', { name: 'Hide password' })).toBeFocused();
      await expect(page.getByLabel('Password (required)', { exact: true })).toHaveAttribute(
        'type',
        'text'
      );
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page.getByText('Enter your email address.')).toBeVisible();
      await expect(page.getByText('Enter your password.')).toBeVisible();
      await expect(page.getByLabel('Email')).toBeFocused();
      if (width === 320) {
        await page.evaluate(() => {
          document.documentElement.style.fontSize = '200%';
        });
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
          false
        );
      }
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
  for (const path of [
    '/student',
    '/faculty',
    '/program-head',
    '/admin',
    '/admin/applications',
    '/faculty/applications',
    '/auth/status',
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(
      path.startsWith('/admin') ? /\/admin\/sign-in/ : /\/auth\/sign-in/
    );
  }
});

test('a failed submission gives a focused error and retains a long email', async ({ page }) => {
  await page.goto('/auth/sign-in');
  await page.route('**/auth/sign-in', (route) =>
    route.request().method() === 'POST' ? route.abort() : route.continue()
  );
  const email = 'synthetic-' + 'x'.repeat(160) + '@example.invalid';
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password (required)', { exact: true }).fill('synthetic password');
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
      const login = role === 'administrator' ? '/admin/sign-in' : '/auth/sign-in';
      await page.goto(login);
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${destination}$`));
      for (const other of ['/student', '/faculty', '/program-head', '/admin']) {
        await page.goto(other);
        await expect(page).toHaveURL(new RegExp(`${destination}$`));
      }
      for (const review of ['/admin/applications', '/faculty/applications']) {
        if (
          (role === 'administrator' && review === '/admin/applications') ||
          (role === 'faculty' && review === '/faculty/applications')
        )
          continue;
        await page.goto(review);
        await expect(page).toHaveURL(new RegExp(`${destination}$`));
      }
      await page.getByRole('button', { name: 'Sign out' }).click();
      await expect(page).toHaveURL(new RegExp(`${login}$`));
      await page.goBack();
      await expect(page).toHaveURL(new RegExp(`${login}$`));
    });
  }
  for (const [role, wrong, correct] of [
    ['administrator', '/auth/sign-in', '/admin/sign-in'],
    ['student', '/admin/sign-in', '/auth/sign-in'],
    ['faculty', '/admin/sign-in', '/auth/sign-in'],
    ['program_head', '/admin/sign-in', '/auth/sign-in'],
  ])
    test(`${role} is refused at the wrong portal without accepting a session`, async ({
      page,
      context,
    }) => {
      const account = await fixtures.createFixture(role);
      await fixtures.harness('state', { account_id: account.id, status: 'approved' });
      await page.goto(wrong);
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page.getByRole('main').getByRole('alert')).toContainText(
        role === 'administrator'
          ? 'Use Administrator sign in'
          : 'Use the Student, Faculty, and Program Head'
      );
      await expect(page.getByRole('main').getByRole('alert').getByRole('link')).toHaveAttribute(
        'href',
        correct
      );
      expect((await context.cookies()).filter((c) => c.name.includes('-auth-token'))).toEqual([]);
    });
  test('wrong-portal attempt preserves a different signed-in account and unrelated cookies', async ({
    page,
    context,
  }) => {
    const faculty = await fixtures.createFixture('faculty');
    const administrator = await fixtures.createFixture('administrator');
    for (const account of [faculty, administrator])
      await fixtures.harness('state', { account_id: account.id, status: 'approved' });
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill(faculty.email);
    await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/faculty$/);
    await context.addCookies([
      { name: 'unrelated', value: 'preserved', url: process.env.APP_ORIGIN! },
    ]);
    const before = (await context.cookies()).map(({ name, value }) => ({ name, value }));
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill(administrator.email);
    await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText(
      'Use Administrator sign in'
    );
    expect((await context.cookies()).map(({ name, value }) => ({ name, value }))).toEqual(before);
    await page.goto('/faculty');
    await expect(page.getByRole('heading', { name: 'Faculty', exact: true })).toBeVisible();
  });
  for (const portal of ['/auth/sign-in', '/admin/sign-in'])
    test(`invalid credentials stay generic at ${portal}`, async ({ page }) => {
      await page.goto(portal);
      await page.getByLabel('Email').fill('missing-synthetic@example.invalid');
      await page.getByLabel('Password (required)', { exact: true }).fill('wrong password');
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page.getByRole('main').getByRole('alert')).toHaveText(
        'Email or password is incorrect. Try again.'
      );
    });
  for (const role of ['faculty', 'administrator'])
    test(`${role} revoked session returns to its portal without stale protected content`, async ({
      page,
    }) => {
      const account = await fixtures.createFixture(role);
      await fixtures.harness('state', { account_id: account.id, status: 'approved' });
      const login = role === 'administrator' ? '/admin/sign-in' : '/auth/sign-in';
      await page.goto(login);
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      const home = role === 'administrator' ? '/admin' : '/faculty';
      await expect(page).toHaveURL(new RegExp(`${home}$`));
      await fixtures.harness('cutoff', { account_id: account.id });
      await page.reload();
      await expect(page).toHaveURL(new RegExp(`${login}\\?session=ended$`));
      await expect(page.getByText('Your session ended. Sign in again.')).toBeVisible();
      await expect(page.getByText('You are signed in.')).toHaveCount(0);
      for (const review of ['/admin/applications', '/faculty/applications']) {
        await page.goto(review);
        await expect(page).toHaveURL(
          review.startsWith('/admin') ? /\/admin\/sign-in/ : /\/auth\/sign-in/
        );
      }
    });
  for (const [state, home] of [
    ['revoked', '/admin'],
    ['deactivated', '/admin/applications'],
  ])
    test(`still-open Administrator ${state} sign-out returns to Admin portal`, async ({ page }) => {
      const account = await fixtures.createFixture('administrator');
      await fixtures.harness('state', { account_id: account.id, status: 'approved' });
      await page.goto('/admin/sign-in');
      await page.getByLabel('Email').fill(account.email);
      await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page).toHaveURL(/\/admin$/);
      await page.goto(home);
      await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
      if (state === 'revoked') await fixtures.harness('cutoff', { account_id: account.id });
      else await fixtures.harness('state', { account_id: account.id, active: false });
      await page.getByRole('button', { name: 'Sign out' }).focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/\/admin\/sign-in$/);
      await page.goBack();
      await expect(page).toHaveURL(/\/admin\/sign-in/);
      await expect(page.getByText('You are signed in.')).toHaveCount(0);
    });
  test('pending applicants see status and no staff destination', async ({ page }) => {
    const account = await fixtures.createFixture('faculty');
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill(account.email);
    await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/status$/);
    await expect(page.getByRole('heading', { name: 'Your application' })).toBeVisible();
    await expect(page.getByText('Pending review', { exact: true })).toBeVisible();
    for (const review of ['/admin/applications', '/faculty/applications']) {
      await page.goto(review);
      await expect(page).toHaveURL(/\/auth\/status$/);
      await expect(page.getByRole('heading', { name: 'Your application' })).toBeVisible();
    }
  });
});
