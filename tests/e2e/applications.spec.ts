import { expect, test, type Page } from '@playwright/test';
test.describe('application status and authorized review', () => {
  test.skip(
    process.env.E2E_AUTH_PROJECT_REF !== 'ggiccvcrkydcimveyrfi',
    'Exact isolated TEST required'
  );
  let fixtures: typeof import('../integration/helpers/fixtures');
  test.setTimeout(60000);
  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    const hydrationErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && /hydration|Minified React error #418/i.test(message.text()))
        hydrationErrors.push(message.text());
    });
    page.on('pageerror', (error) =>
      errors.push(new URL(page.url()).pathname + ': ' + (error.stack ?? error.message))
    );
    test.info().annotations.push({
      type: 'transport',
      description: 'Explicit generated proof TEST mail transport; no inbox claim.',
    });
    (page as Page & { task4Errors?: string[] }).task4Errors = errors;
    (page as Page & { hydrationErrors?: string[] }).hydrationErrors = hydrationErrors;
  });
  test.afterEach(async ({ page }) => {
    expect((page as Page & { task4Errors?: string[] }).task4Errors).toEqual([]);
    expect((page as Page & { hydrationErrors?: string[] }).hydrationErrors).toEqual([]);
  });
  test.beforeAll(async () => {
    fixtures = await import('../integration/helpers/fixtures');
  });
  test.afterAll(async () => {
    if (fixtures) await fixtures.cleanFixtures();
  });
  test('Faculty decision dialog requests correction with keyboard cancel and focus return', async ({
    page,
  }) => {
    const f = await verifiedApplicant(page);
    const reviewer = await fixtures.createFixture('faculty');
    await fixtures.harness('state', { account_id: reviewer.id, status: 'approved' });
    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill(reviewer.email);
    await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/faculty$/);
    await page.goto('/faculty/applications?application=' + f.id);
    await expect(
      page.getByRole('heading', { name: 'Student applications', exact: true })
    ).toBeVisible();
    await page.getByLabel('Request correction', { exact: true }).check();
    await page
      .getByLabel('Reason (required)', { exact: true })
      .fill('Synthetic correction: match the enrollment name.');
    await page.getByRole('button', { name: 'Review decision', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel', exact: true })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Review decision', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await dialog.getByRole('button', { name: 'Send correction request', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Decision saved');
    await expect(
      page.getByText('Synthetic correction: match the enrollment name.', { exact: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Reopen application', exact: true })).toHaveCount(
      0
    );
    await page.reload();
    await expect(
      page.getByText('Synthetic correction: match the enrollment name.', { exact: true })
    ).toBeVisible();
    await expect(page.locator('time')).toContainText('GMT+8');
  });

  async function login(page: Page, email: string, role = 'student') {
    await page.goto(role === 'administrator' ? '/admin/sign-in' : '/auth/sign-in');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(
      role === 'administrator'
        ? /\/admin$/
        : role === 'faculty'
          ? /\/faculty$/
          : /\/auth\/status|\/student$/
    );
  }
  async function verifiedApplicant(page: Page, role = 'student') {
    const f = await fixtures.createFixture(role, false);
    const link = await fixtures.admin.auth.admin.generateLink({
      type: 'signup',
      email: f.email,
      password: fixtures.fixturePassword,
    });
    if (link.error) throw Error('Synthetic generated proof unavailable');
    const queued = await fixtures.admin.rpc('queue_generated_auth_email', {
      target_id: f.id,
      recipient: f.email,
      native_type: 'signup',
      native_verifier: link.data.properties.hashed_token,
    });
    if (queued.error) throw Error('Synthetic proof queue unavailable');
    const proof = await fixtures.admin.rpc('test_email_fixture', {
      action: 'inspect',
      run_id: fixtures.runId,
      args: { project_ref: fixtures.testProjectRef, account_id: f.id },
    });
    await page.goto('/auth/email?challenge=' + proof.data.challenge);
    await page.getByRole('button', { name: 'Confirm email', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Email verified', exact: true })).toBeFocused();
    await expect(page).toHaveURL(/\/auth\/email$/);
    await page.getByRole('link', { name: 'Sign in to view application', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await expect(page.getByRole('heading', { name: 'Sign in', exact: true })).toBeVisible();
    return f;
  }
  for (const width of [1280, 320]) {
    test(`unverified applications cannot be reviewed through queue or direct URL at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      const f = await fixtures.createFixture('student', false);
      const reviewer = await fixtures.createFixture('faculty');
      await fixtures.harness('state', { account_id: reviewer.id, status: 'approved' });
      await login(page, reviewer.email, 'faculty');
      await page.goto('/faculty/applications');
      await expect(page.locator(`a[href*="application=${f.id}"]`)).toHaveCount(0);
      await page.goto('/faculty/applications?application=' + f.id);
      await expect(page.getByText(/Verify the current email before reviewing/)).toBeVisible();
      await expect(page.getByRole('button', { name: 'Review decision', exact: true })).toHaveCount(
        0
      );
      await expect(page.getByRole('radio')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false
      );
      await page.screenshot({
        path: `.playwright-cli/fbr-unverified-${width}.png`,
        fullPage: true,
      });
    });
    test(`identity inputs cannot accept edits during pending save at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      const f = await verifiedApplicant(page);
      await login(page, f.email);
      await page.getByRole('button', { name: 'Edit application', exact: true }).click();
      const name = page.getByLabel('Full name (required)');
      const number = page.getByLabel('Student number (required)');
      await name.fill('Submitted synthetic name');
      let release!: () => void;
      const held = new Promise<void>((resolve) => {
        release = resolve;
      });
      await page.route('**/auth/status', async (route) => {
        if (route.request().method() === 'POST') await held;
        await route.continue();
      });
      try {
        await page.getByRole('button', { name: 'Save changes', exact: true }).focus();
        await page.keyboard.press('Enter');
        await expect(name).toBeDisabled();
        await expect(number).toBeDisabled();
        await page.keyboard.press('Tab');
        await expect(name).not.toBeFocused();
        await expect(number).not.toBeFocused();
        expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
          false
        );
        await page.screenshot({
          path: `.playwright-cli/fbr-pending-save-${width}.png`,
          fullPage: true,
        });
      } finally {
        release();
      }
      await expect(page.getByRole('status')).toContainText('Changes saved');
      await page.unroute('**/auth/status');
      await page.getByRole('button', { name: 'Edit application', exact: true }).click();
      await expect(name).toHaveValue('Submitted synthetic name');
      await expect(name).toBeEnabled();
      await expect(number).toBeEnabled();
    });
  }
  test('Student correction, resubmission and verified Faculty approval retain one application', async ({
    page,
  }) => {
    const f = await verifiedApplicant(page);
    const reviewer = await fixtures.createFixture('faculty');
    await fixtures.harness('state', { account_id: reviewer.id, status: 'approved' });
    const client = (await fixtures.signIn(reviewer)).client;
    expect(
      (
        await client.rpc('review_application', {
          target_id: f.id,
          expected_version: 1,
          request_id: crypto.randomUUID(),
          decision: 'needs_correction',
          reason: 'Synthetic check: complete the enrollment name.',
          attestations: {},
        })
      ).error
    ).toBeNull();
    await login(page, f.email);
    await expect(
      page.getByText('Synthetic check: complete the enrollment name.', { exact: true })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Edit application', exact: true }).click();
    await page.getByLabel('Full name (required)').fill('Synthetic full enrollment name');
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Changes saved');
    await expect(
      page.getByRole('heading', { name: 'Needs correction', exact: true })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Resubmit for review', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Application resubmitted');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await login(page, reviewer.email, 'faculty');
    await page.goto('/faculty/applications?application=' + f.id);
    await page.getByLabel('Approve application', { exact: true }).check();
    await page.getByRole('button', { name: 'Review decision', exact: true }).click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('verification');
    await page
      .getByLabel('I compared the name and student number with the enrollment list.')
      .check();
    await page.getByRole('button', { name: 'Review decision', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Approve application', exact: true })
      .click();
    await expect(page.getByRole('status')).toContainText('Decision saved');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await login(page, f.email);
    await expect(page).toHaveURL(/\/student$/);
  });
  test('Administrator rejects and reopens Faculty with long reasons at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    const f = await verifiedApplicant(page, 'faculty');
    const applicant = (await fixtures.signIn(f)).client;
    expect(
      (
        await applicant.rpc('save_application', {
          expected_version: 1,
          full_name: 'Synthetic' + 'X'.repeat(191),
          student_number: null,
          employee_number: null,
        })
      ).error
    ).toBeNull();
    const administrator = await fixtures.createFixture('administrator');
    await fixtures.harness('state', { account_id: administrator.id, status: 'approved' });
    await login(page, administrator.email, 'administrator');
    await page.goto('/admin/applications?application=' + f.id + '&role=faculty');
    await page.getByLabel('Reject application', { exact: true }).check();
    const reason = ('Synthetic school-record mismatch. ' + 'Longreason'.repeat(197)).slice(0, 2000);
    await page.getByLabel('Reason (required)', { exact: true }).fill(reason);
    await page.getByRole('button', { name: 'Review decision', exact: true }).click();
    await expect(
      page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true })
    ).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false
    );
    await page.screenshot({
      path: '.playwright-cli/task4-rejection-dialog-320.png',
      fullPage: false,
      animations: 'disabled',
    });
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Reject application', exact: true })
      .click();
    await expect(page.getByRole('status')).toContainText('Decision saved');
    await page.getByRole('button', { name: 'Reopen application', exact: true }).click();
    await page
      .getByLabel('Reason (required)', { exact: true })
      .fill('Synthetic verified record error; reopen for a new review.');
    await page.getByLabel('I verified the error before reopening this application.').check();
    await page.getByRole('button', { name: 'Review decision', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('does not approve or reactivate');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Reopen for review', exact: true })
      .click();
    await expect(page.getByRole('status')).toContainText('Decision saved');
    await expect(page.getByText('Pending review', { exact: true }).last()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false
    );
    await page.screenshot({ path: '.playwright-cli/task4-admin-review-320.png', fullPage: true });
  });
  test('a stale reviewer preserves the reason and cannot decide again before reloading', async ({
    page,
  }) => {
    const f = await verifiedApplicant(page);
    const reviewer = await fixtures.createFixture('faculty');
    await fixtures.harness('state', { account_id: reviewer.id, status: 'approved' });
    await login(page, reviewer.email, 'faculty');
    await page.goto('/faculty/applications?application=' + f.id);
    await page.getByLabel('Request correction', { exact: true }).check();
    await page.getByLabel('Reason (required)', { exact: true }).fill('Keep this synthetic reason.');
    const applicant = (await fixtures.signIn(f)).client;
    expect(
      (
        await applicant.rpc('save_application', {
          expected_version: 1,
          full_name: 'New synthetic identity',
          student_number: f.studentNumber,
          employee_number: null,
        })
      ).error
    ).toBeNull();
    await page.getByRole('button', { name: 'Review decision', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Send correction request', exact: true })
      .click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('Application updated');
    await expect(page.getByLabel('Reason (required)', { exact: true })).toHaveValue(
      'Keep this synthetic reason.'
    );
    await expect(page.getByRole('button', { name: 'Review decision', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Reload current application', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'New synthetic identity', exact: true })
    ).toBeVisible();
  });
  test('a lost decision response retries the same saved decision once', async ({ page }) => {
    const f = await verifiedApplicant(page);
    const reviewer = await fixtures.createFixture('faculty');
    await fixtures.harness('state', { account_id: reviewer.id, status: 'approved' });
    await login(page, reviewer.email, 'faculty');
    await page.goto('/faculty/applications?application=' + f.id);
    await page.getByLabel('Request correction', { exact: true }).check();
    await page
      .getByLabel('Reason (required)', { exact: true })
      .fill('Synthetic lost response reason.');
    await page.getByRole('button', { name: 'Review decision', exact: true }).click();
    await page.route(
      '**/faculty/applications?application=' + f.id,
      async (route) => {
        const response = await route.fetch();
        expect(response.ok()).toBe(true);
        await route.abort('failed');
      },
      { times: 1 }
    );
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Send correction request', exact: true })
      .click();
    await expect(page.getByRole('main').getByRole('alert')).toContainText('confirm');
    await expect(page.getByLabel('Reason (required)', { exact: true })).toHaveValue(
      'Synthetic lost response reason.'
    );
    await page.getByRole('button', { name: 'Review decision', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Send correction request', exact: true })
      .click();
    await expect(page.getByRole('status')).toContainText('Decision saved');
    const current = await (await fixtures.signIn(f)).client.rpc('application_details');
    expect(current.data.history).toHaveLength(1);
    expect(current.data.version).toBe(2);
  });
  test('revoking a reviewer while the dialog is open removes protected details', async ({
    page,
  }) => {
    const f = await verifiedApplicant(page);
    const reviewer = await fixtures.createFixture('faculty');
    await fixtures.harness('state', { account_id: reviewer.id, status: 'approved' });
    await login(page, reviewer.email, 'faculty');
    await page.goto('/faculty/applications?application=' + f.id);
    await page.getByLabel('Reject application', { exact: true }).check();
    await page
      .getByLabel('Reason (required)', { exact: true })
      .fill('Synthetic revoked reviewer reason.');
    await page.getByRole('button', { name: 'Review decision', exact: true }).click();
    await fixtures.harness('cutoff', { account_id: reviewer.id });
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Reject application', exact: true })
      .click();
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(f.email, { exact: true })).toHaveCount(0);
    expect((await (await fixtures.signIn(f)).client.rpc('application_details')).data.status).toBe(
      'pending'
    );
  });
  test('replacement email proof is inert on GET, commits on POST, and ends the old session', async ({
    page,
  }) => {
    const f = await verifiedApplicant(page);
    await login(page, f.email);
    const email = `fixture-${fixtures.runId.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`;
    await page.getByLabel('Replacement email (required)', { exact: true }).fill(email);
    await page.getByRole('button', { name: 'Verify replacement email', exact: true }).click();
    await expect(
      page.getByText('Replacement email awaiting verification', { exact: true })
    ).toBeVisible();
    const proof = await fixtures.admin.rpc('test_email_fixture', {
      action: 'inspect',
      run_id: fixtures.runId,
      args: { project_ref: fixtures.testProjectRef, account_id: f.id },
    });
    await page.goto('/auth/email?challenge=' + proof.data.challenge);
    expect((await fixtures.admin.auth.admin.getUserById(f.id)).data.user?.email).toBe(f.email);
    await page.getByRole('button', { name: 'Confirm email', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Replacement email verified', exact: true })
    ).toBeVisible();
    await page.goto('/auth/status');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
    await login(page, email);
    await expect(page.getByText(email, { exact: true }).first()).toBeVisible();
  });

  test('replacement email actions preserve the unsaved identity draft and current version', async ({
    page,
  }) => {
    const f = await verifiedApplicant(page);
    const client = (await fixtures.signIn(f)).client;
    await login(page, f.email);
    await page.getByRole('button', { name: 'Edit application', exact: true }).click();
    const name = 'Synthetic unsaved identity draft';
    const number = '00' + crypto.randomUUID();
    await page.getByLabel('Full name (required)').fill(name);
    await page.getByLabel('Student number (required)').fill(number);
    await page
      .getByLabel('Replacement email (required)', { exact: true })
      .fill(
        `fixture-${fixtures.runId.slice(0, 8)}-${crypto.randomUUID().slice(0, 8)}@caloocan.sti.edu.ph`
      );
    await page.getByRole('button', { name: 'Verify replacement email', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('verification queued');
    await expect(page.getByLabel('Full name (required)')).toHaveValue(name);
    await expect(page.getByLabel('Student number (required)')).toHaveValue(number);
    expect((await client.rpc('application_details')).data.version).toBe(2);
    await page.getByRole('button', { name: 'Cancel replacement email', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('cancelled');
    await expect(page.getByLabel('Full name (required)')).toHaveValue(name);
    await expect(page.getByLabel('Student number (required)')).toHaveValue(number);
    expect((await client.rpc('application_details')).data.version).toBe(3);
    await page.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Changes saved');
    expect((await client.rpc('application_details')).data).toMatchObject({
      version: 4,
      full_name: name,
      student_number: number,
      email: f.email,
    });
  });
  test('wordmark navigation asks before abandoning unsaved identity edits', async ({ page }) => {
    const f = await verifiedApplicant(page);
    await login(page, f.email);
    await page.getByRole('button', { name: 'Edit application', exact: true }).click();
    await page.getByLabel('Full name (required)').fill('Synthetic draft to retain');
    await page.getByLabel('Student number (required)').fill('00999');
    let leave = false;
    const prompts: string[] = [];
    page.on('dialog', async (dialog) => {
      prompts.push(dialog.message());
      if (leave) await dialog.accept();
      else await dialog.dismiss();
    });
    const wordmark = page.getByRole('link', { name: 'CS-GAMUERS', exact: true });
    await wordmark.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/auth\/status$/);
    expect(prompts).toHaveLength(1);
    await expect(page.getByLabel('Full name (required)')).toHaveValue('Synthetic draft to retain');
    await expect(page.getByLabel('Student number (required)')).toHaveValue('00999');
    leave = true;
    await wordmark.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('https://127.0.0.1:3443/');
    expect(prompts).toHaveLength(2);
  });
  test('application actions and reviewer menu reflow at 320px with 200% text', async ({ page }) => {
    const applicant = await verifiedApplicant(page);
    const reviewer = await fixtures.createFixture('faculty');
    await fixtures.harness('state', { account_id: applicant.id, status: 'needs_correction' });
    await fixtures.harness('state', { account_id: reviewer.id, status: 'approved' });
    await page.setViewportSize({ width: 320, height: 800 });
    await login(page, applicant.email);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await expect(
      page.getByRole('button', { name: 'Resubmit for review', exact: true })
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true
    );
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '';
    });
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await login(page, reviewer.email, 'faculty');
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    const trigger = page.getByRole('button', { name: 'Toggle Sidebar', exact: true });
    for (const activation of ['pointer', 'keyboard']) {
      if (activation === 'pointer') await trigger.click();
      else {
        await trigger.focus();
        await page.keyboard.press('Enter');
      }
      const menu = page.getByRole('dialog');
      await expect(menu).toBeVisible();
      await expect
        .poll(() =>
          menu.evaluate((node) => {
            const rect = node.getBoundingClientRect();
            return rect.left >= 0 && rect.right <= innerWidth;
          })
        )
        .toBe(true);
      expect(
        await menu
          .locator('a:visible,button:visible')
          .evaluateAll((nodes) =>
            nodes.every(
              (node) =>
                node.getBoundingClientRect().left >= 0 &&
                node.getBoundingClientRect().right <= innerWidth
            )
          )
      ).toBe(true);
      expect(
        await menu
          .getByText('CS-GAMUERS', { exact: true })
          .evaluate((node) => node.scrollWidth <= node.clientWidth)
      ).toBe(true);
      await page.keyboard.press('Escape');
      await expect(menu).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect
        .poll(() =>
          trigger.evaluate((node) => {
            const style = getComputedStyle(node);
            return style.outlineStyle !== 'none' || style.boxShadow !== 'none';
          })
        )
        .toBe(true);
    }
  });
  for (const width of [1280, 320])
    test(`pending applicant edits same application at ${width}px`, async ({ page }) => {
      const f = await verifiedApplicant(page);
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/auth/sign-in');
      await page.getByLabel('Email').fill(f.email);
      await page.getByLabel('Password (required)', { exact: true }).fill(fixtures.fixturePassword);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(
        page.getByRole('heading', { name: 'Your application', exact: true })
      ).toBeVisible();
      await page.getByRole('button', { name: 'Edit application' }).click();
      await page.getByLabel('Full name (required)').fill('Synthetic corrected applicant');
      await page.getByRole('button', { name: 'Save changes', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('Changes saved');
      await page.reload();
      await expect(page.getByText('Synthetic corrected applicant', { exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
        false
      );
    });
});
